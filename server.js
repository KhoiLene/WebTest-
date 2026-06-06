const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    user: "sa",
    password: "Admin@123",
    server: "localhost",
    port: 1433,
    database: "hcmute_login",
    options: {
        trustServerCertificate: true
    }
};

// ===== GET USERS =====
app.get("/users", async (req, res) => {
    let pool = await sql.connect(config);
    let result = await pool.request().query("SELECT * FROM users");
    res.json(result.recordset);
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    let pool = await sql.connect(config);

    let result = await pool.request()
        .input("u", sql.VarChar, username)
        .input("p", sql.VarChar, password)
        .query("SELECT * FROM users WHERE username=@u AND password=@p");

    if (result.recordset.length === 0) {
        return res.json({ ok: false });
    }

    res.json({ ok: true, user: result.recordset[0] });
});

// ===== ADD USER =====
app.post("/users", async (req, res) => {
    const { username, email, password, role } = req.body;

    let pool = await sql.connect(config);

    // Kiểm tra username đã tồn tại chưa
    let check = await pool.request()
        .input("u", sql.VarChar, username)
        .query("SELECT id FROM users WHERE username=@u");

    if (check.recordset.length > 0) {
        return res.json({ ok: false, message: "Username đã tồn tại!" });
    }

    await pool.request()
        .input("u", sql.VarChar, username)
        .input("e", sql.VarChar, email)
        .input("p", sql.VarChar, password)
        .input("r", sql.VarChar, role)
        .query(`
            INSERT INTO users(username, email, password, role, mustChangePassword)
            VALUES (@u, @e, @p, @r, 1)
        `);

    res.json({ ok: true });
});

// ===== DELETE USER =====
app.delete("/users/:id", async (req, res) => {
    const { id } = req.params;

    let pool = await sql.connect(config);

    await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM users WHERE id=@id");

    res.json({ ok: true });
});

// ===== RESET PASSWORD (Admin) =====
app.put("/users/reset-password", async (req, res) => {
    const { username, password } = req.body;

    let pool = await sql.connect(config);

    let check = await pool.request()
        .input("u", sql.VarChar, username)
        .query("SELECT id FROM users WHERE username=@u");

    if (check.recordset.length === 0) {
        return res.json({ ok: false, message: "User không tồn tại!" });
    }

    await pool.request()
        .input("u", sql.VarChar, username)
        .input("p", sql.VarChar, password)
        .query("UPDATE users SET password=@p, mustChangePassword=1 WHERE username=@u");

    res.json({ ok: true });
});

// ===== CHANGE PASSWORD (User tự đổi) =====
app.put("/users/change-password", async (req, res) => {
    const { username, password } = req.body;

    let pool = await sql.connect(config);

    await pool.request()
        .input("u", sql.VarChar, username)
        .input("p", sql.VarChar, password)
        .query("UPDATE users SET password=@p, mustChangePassword=0 WHERE username=@u");

    res.json({ ok: true });
});

app.listen(3000, () => {
    console.log("Server running http://localhost:3000");
});