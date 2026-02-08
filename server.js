const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle form data

// Configuration
// Be specific about the root directory we are serving/modifying
const ROOT_DIR = path.resolve(__dirname);
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

console.log('Server Root:', ROOT_DIR);
console.log('Public Dir:', PUBLIC_DIR);


// File Upload Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // The 'path' comes from the form-data body.
    // IMPORTANT: multer processes file BEFORE body fields if file is first.
    // Client must append 'path' field BEFORE 'file' field.
    const relativePath = req.body.path || '';
    const uploadPath = path.join(PUBLIC_DIR, relativePath);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use the original name, or a custom name if provided in body
    const finalName = req.body.filename || file.originalname;
    cb(null, finalName);
  }
});

const upload = multer({ storage: storage });


/**
 * Validate that a requested path is safe and within the allowed directory.
 * @param {string} requestedPath - Relative path from public root (e.g., "Physics/phy-t1/content.csv")
 * @returns {string} - The absolute safe path
 */
const getSafePath = (requestedPath) => {
    // Normalize and resolve against PUBLIC_DIR
    const safePath = path.resolve(PUBLIC_DIR, requestedPath);

    // Check if it's still inside PUBLIC_DIR (prevents ../ traversal)
    if (!safePath.startsWith(PUBLIC_DIR)) {
        throw new Error('Access denied: Path traversal detected.');
    }
    return safePath;
};


// --- API ROUTES ---

// 1. List Files in a Directory
app.get('/api/files', (req, res) => {
    try {
        const dirPath = req.query.path || '';
        const fullPath = getSafePath(dirPath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Directory not found' });
        }

        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, item.name).replace(/\\/g, '/') // Normalized forward slashes
        }));

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. Read File Content (Text/CSV)
app.get('/api/file', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) throw new Error('Path parameter is required');

        const fullPath = getSafePath(filePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        res.send(content); // Send raw text/csv
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. Save File Content (Text/CSV)
app.post('/api/file', (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        if (!filePath) throw new Error('Path is required');

        const fullPath = getSafePath(filePath);

        // Ensure parent directory exists
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Saved file: ${filePath}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Save error:', err);
        res.status(400).json({ error: err.message });
    }
});

// 4. Upload Binary File (PDF, Word, Images)
// Client must send FormData: 'path' (relative dir), 'filename' (optional), 'file' (blob)
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(`Uploaded: ${req.file.path}`);
        res.json({ success: true, filename: req.file.filename, path: req.file.path });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete File
app.delete('/api/file', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) throw new Error('Path is required');

        const fullPath = getSafePath(filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted: ${filePath}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 6. Run Validation Script
app.get('/api/validate', (req, res) => {
    const scriptPath = path.join(ROOT_DIR, 'scripts', 'validate_structure.py');
    console.log(`Running validation: python "${scriptPath}"`);

    exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            // Don't fail the request, just return the error output
        }

        // Attempt to parse JSON output if the script outputs JSON
        // Otherwise return raw text
        try {
            const jsonOutput = JSON.parse(stdout);
            res.json(jsonOutput);
        } catch (e) {
            res.json({
                raw_output: stdout,
                stderr: stderr,
                status: error ? 'error' : 'success'
            });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
    console.log(`Serving/Managing files in: ${PUBLIC_DIR}`);
});
