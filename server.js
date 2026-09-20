const express = require('express');//setup all the plugins
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

//serve all frotend files
app.use(express.static(path.join(__dirname)));

// MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'Ni55an-1972070404',
  database: 'coursework',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// SIGN UP - create a new user
app.post('/api/signup', async (req, res) => {
  const { FirstName, SecondName, Email, UserName, Password } = req.body;

  if (!FirstName || !SecondName || !Email || !UserName || !Password) {//if something is not typed on login
    return res.status(400).json({ error: 'All fields required!' });
  }

  try {
    pool.query(
      'SELECT * FROM users WHERE UserName = ? OR Email = ?',//get all current users in database 
      [UserName, Email],
      async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {//if user already exists
          return res.status(409).json({ error: 'Username or email already exists!' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert new user
        const sql = `
          INSERT INTO users
          (FirstName, SecondName, UserName, Password, Email, CreatedAt, UpdatedAt, OnlineStatus, DeleteAccount, UserRole)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'Inactive', 0, 'Player')
        `;

        pool.query(sql, [FirstName, SecondName, UserName, hashedPassword, Email], (err, result) => {
          if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ message: 'Account created successfully!' });
        });
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Login
app.post('/api/login', (req, res) => {
  const { UserName, Password, AdminCode } = req.body;

  if (!UserName || !Password) {//if username/password not typed in login fields
    return res.status(400).json({ error: 'Username and password required' });
  }

  const sql = 'SELECT * FROM users WHERE UserName = ? LIMIT 1';//find the match for the login in the user table

  pool.query(sql, [UserName], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {//if no user match is found in the database  
      console.log('No user found for username:', UserName);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];
    console.log('Found user:', user.UserName);
    console.log('Entered password:', Password);
    console.log('Stored hash:', user.Password);

    const match = await bcrypt.compare(Password, user.Password);//check to see if password is correct
    console.log('Password match result:', match);

    if (!match) {//if password does not match
      return res.status(401).json({ error: 'Invalid username or password' });
    }
	
	let role = user.UserRole;  // default to stored role
	console.log("Current DB role:", user.UserRole);
	console.log("Admin code entered:", AdminCode);

	if (AdminCode === "N1MaDjIs" && user.UserRole !== "Admin") {//if the admin code is entered correctly and hasnt been entered before for this login give them admin permissions
	console.log("Admin code correct — upgrading to ADMIN role");
    role = "Admin";

    // permanently update admin role in database
    pool.query(
        "UPDATE users SET UserRole = 'Admin' WHERE UserId = ?",
        [user.UserId],
		(updateErr) => {
            if (updateErr) console.error("Role update error:", updateErr);
            else console.log("DB role updated for user:", user.UserId);
        }
    );

	}else {
    console.log("Not updating role");
}

	
	

    pool.query('UPDATE users SET OnlineStatus = ? WHERE UserId = ?', ['Active', user.UserId]);//make the user active after logging in

    res.json({//load the users details while logged in on the site
      message: 'Login successful!',
      user: {
        id: user.UserId,
        UserName: user.UserName,
        FirstName: user.FirstName,
        SecondName: user.SecondName,
        Email: user.Email,
		CreatedAt: user.CreatedAt,
        Role: role
      }
    });
  });
});


// Save a score (for any game)
app.post('/api/save-score', (req, res) => {
  const { userId, gameId, score} = req.body;

  if (userId==null ||gameId==null || score==null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO scores (UserId, GameId, Score)
    VALUES (?, ?, ?)
  `;//add new score into database

  pool.query(sql, [userId, gameId, score], (err,result) => {
    if (err) {
      console.error('Error saving score:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Score saved successfully!' });
  });
});


// Get top 10 Wordle streaks (gameId = 1)
app.get('/api/leaderboard/wordle', (req, res) => {
    const sql = `
        SELECT 
            users.UserName,
            MAX(scores.Score) AS TopStreak
        FROM scores
        JOIN users ON users.UserId = scores.UserId
        WHERE scores.GameId = 1
        GROUP BY users.UserId
        ORDER BY TopStreak DESC
        LIMIT 10;
    `;//creates the wordle leaderboard

    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Leaderboard fetch error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get top 10 Maths scores (gameId = 2)
app.get('/api/leaderboard/maths', (req, res) => {
    const sql = `
        SELECT 
            users.UserName,
            MAX(scores.Score) AS TopScore
        FROM scores
        JOIN users ON users.UserId = scores.UserId
        WHERE scores.GameId = 2
        GROUP BY users.UserId
        ORDER BY TopScore DESC
        LIMIT 10;
    `;//creates the maths racing game leaderboard

    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Maths Leaderboard fetch error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});


//get the users best score on maths
app.get("/api/maths-best/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT MAX(Score) AS BestScore
    FROM scores
    WHERE UserId = ? AND GameId = 2
  `;//create bestscore field and put the top score from said user

  pool.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ best: results[0].BestScore || 0 });
  });
});

// Get the user's best Wordle streak (GameId = 1)
app.get("/api/wordle-best/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT MAX(Score) AS BestStreak
    FROM scores
    WHERE UserId = ? AND GameId = 1
  `;//create beststreak field and put the users top streak in

  pool.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ best: results[0].BestStreak || 0 });
  });
});


// Route to fetch words from the database
app.get('/api/words', (req, res) => {
  const { topic, difficulty } = req.query;

  if (!topic || !difficulty) {
    return res.status(400).json({ error: 'Missing theme or difficulty' });
  }

  const sql = `
    SELECT Answer
    FROM Game_Content
    WHERE topic = ? AND Difficulty = ?
  `;

  // Capitalize difficulty to match database values (e.g., "Easy", "Medium", "Hard")
  const formattedDifficulty =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

  pool.query(sql, [topic.toLowerCase(), formattedDifficulty], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // If theme is lowercase in database, ensure matching case in WHERE clause
    const words = results.map(row => row.Answer);
    res.json(words);
  });
});

//default route to homepage
app.get('/',(req,res)=>{
	res.sendFile(path.join(__dirname,'Home_Page','home-page.html'));
});

// GET all users for admin
app.get("/api/users", (req, res) => {
  pool.query(
    "SELECT UserId, FirstName, SecondName, UserName, Email, UserRole, OnlineStatus FROM users WHERE DeleteAccount = 0",
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
});

//DELETE user
app.delete("/api/delete-user/:id", (req,res) => {
  const id = req.params.id;
  
  pool.query("DELETE FROM scores WHERE UserId = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });

    pool.query("DELETE FROM users WHERE UserId = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: "DB error" });

      res.json({ message: "User and related scores permanently deleted" });
    });
  });
});
 

// Add new Word
app.post("/api/add-word", (req, res) => {
  const { word, topic, difficulty } = req.body;

  const sql = `
    INSERT INTO Game_Content (Answer, topic, Difficulty)
    VALUES (?, ?, ?)
  `;

  pool.query(sql, [word.toLowerCase(), topic.toLowerCase(), difficulty], (err) => {
    if (err) return res.status(500).json({ error: "DB insert error" });
    res.json({ message: "Word added successfully" });
  });
});

// Delete Word
app.delete("/api/delete-word", (req, res) => {
  const { word, topic, difficulty } = req.body;

  const sql = `
    DELETE FROM Game_Content
    WHERE Answer = ? AND topic = ? AND Difficulty = ?
  `;

  pool.query(sql, [word.toLowerCase(), topic.toLowerCase(), difficulty], (err) => {
    if (err) return res.status(500).json({ error: "DB delete error" });
    res.json({ message: "Word deleted successfully" });
  });
});

//alter the settings of the maths racing game (e.g.. time, points, etc.)
app.get("/api/maths-settings", (req, res) => {
  pool.query("SELECT * FROM maths_settings LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(results[0]);
  });
});

app.post("/api/maths-settings", (req, res) => {
  const { TimeLimit, SimplePoints, SimplePenalty, MediumPoints, MediumPenalty, HardPoints, HardPenalty } = req.body;

  const sql = `
    UPDATE maths_settings 
    SET TimeLimit=?, SimplePoints=?, SimplePenalty=?, MediumPoints=?, MediumPenalty=?, HardPoints=?, HardPenalty=?
    WHERE SettingId = 1
  `;

  pool.query(sql, [TimeLimit, SimplePoints, SimplePenalty, MediumPoints, MediumPenalty, HardPoints, HardPenalty], (err) => {
    if (err) return res.status(500).json({ error: "DB update error" });
    res.json({ message: "Maths settings updated successfully" });
  });
});





// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
