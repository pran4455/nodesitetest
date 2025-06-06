require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const { execFile } = require('child_process');
const { getDB, initDB } = require('./dbsetup');
const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
initDB();

// Use system Python or specified path
const pythonpath = process.env.PYTHON_VERSION ? "python3" : process.env.PYTHON_PATH || "python3";

// Initialize database
initDB();

// Get database instance
const db = getDB();

// Read Excel File
function readExcelFile() {
    const filePath = 'sbilife.xlsx';
    if (!fs.existsSync(filePath)) return [];
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

// Serve login page (default page)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Serve policies page (restricted)
app.get('/policies', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.redirect('/');
        res.sendFile(__dirname + '/public/policies.html');
    });
});

// Get policies data
app.get('/api/policies', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid session" });
        res.json(readExcelFile());
    });
});

// Register user
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password and email are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const totp_secret = ''; // Initialize with empty string as per schema requirement

    db.run(
        `INSERT INTO users (
            username, 
            password, 
            email, 
            totp_secret,
            profile_completed
        ) VALUES (?, ?, ?, ?, FALSE)`,
        [username, hashedPassword, email, totp_secret],
        (err) => {
            if (err) {
                console.error('Registration error:', err);
                return res.status(400).json({ error: "User already exists" });
            }
            res.json({ message: "Registration successful" });
        }
    );
});

// Login user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie("auth_token", token, { httpOnly: true }).json({ message: "Login successful" });
    });
});

// Save policy selection (Restricted to logged-in users)
app.post('/api/select-policy', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid session" });        const { policy } = req.body;
        db.run(`UPDATE users SET policy = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?`, 
            [policy, user.username], (err) => {
                if (err) {
                    console.error('Error saving policy:', err);
                    return res.status(500).json({ error: "Failed to save policy" });
                }
                res.json({ message: "Policy saved successfully!" });
        });
    });
});

// Serve policy choice page after login
app.get('/policy_choice', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.redirect('/');
        res.sendFile(__dirname + '/public/policy_choice.html');
    });
});

app.get('/recommend', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.redirect('/');
        res.sendFile(__dirname + '/public/recommend.html');
    });
});

app.post('/api/recommend', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid session" });

        const { description } = req.body;

        // Call Python script with user description
        execFile(pythonpath, ['policypredict.py', description], (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${stderr}`);
                return res.status(500).json({ error: "Prediction failed" });
            }

            try {
                const prediction = JSON.parse(stdout.trim());
                res.json([prediction]);
            } catch (err) {
                console.error('Error parsing Python output:', err);
                return res.status(500).json({ error: "Invalid prediction format" });
            }
        });
    });
});

// Save selected policy from recommendation page
app.post('/api/select-policy-rec', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid session" });

        const { policy } = req.body;
        db.run(`UPDATE users SET policy = ? WHERE username = ?`, [policy, user.username], (err) => {
            if (err) return res.status(500).json({ error: "Failed to save policy" });
            res.json({ message: "Policy selection saved from recommendations!" });
        });
    });
});
// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie("auth_token").json({ message: "Logged out successfully" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

