const API = "http://localhost:3000";

// ===== INIT =====
// Dữ liệu khởi tạo đã có sẵn trong SQL (INSERT INTO users ...), không cần init ở frontend

// ===== FIND USER (dùng nội bộ) =====
async function findUser(username) {
    const res = await fetch(`${API}/users`);
    const users = await res.json();
    return users.find(u => u.username === username);
}

// ===== HIỂN THỊ USER LIST =====
async function renderUsers() {
    const list = document.getElementById("userList");
    if (!list) return;

    const res = await fetch(`${API}/users`);
    const users = await res.json();

    list.innerHTML = "";
    users.forEach((user, index) => {
        list.innerHTML += `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${user.mustChangePassword ? "Chưa đổi mật khẩu" : "OK"}</td>
                <td>
                    <button onclick="deleteUser(${user.id})">Xoá</button>
                </td>
            </tr>
        `;
    });
}

// ===== LOGIN (user thường) =====
async function userLogin() {
    const u = document.getElementById("user").value.trim();
    const p = document.getElementById("pass").value;

    if (!u || !p) {
        alert("Vui lòng nhập username và password!");
        return;
    }

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (!data.ok || data.user.role !== "user") {
        alert("Sai tài khoản user!");
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(data.user));

    if (data.user.mustChangePassword) {
        window.location.href = "change-password.html";
    } else {
        window.location.href = "new.html";
    }
}

// ===== ADMIN LOGIN =====
async function adminLogin() {
    const u = document.getElementById("adminUser").value.trim();
    const p = document.getElementById("adminPass").value;

    console.log("Đang login:", u, p); // ← thêm

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, password: p })
        });

        console.log("Status:", res.status); // ← thêm

        const data = await res.json();
        console.log("Response:", data); // ← thêm

        if (!data.ok || data.user.role !== "lecturer") {
            alert("Sai tài khoản admin!");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(data.user));
        window.location.href = "adminWEB.html";

    } catch(err) {
        console.error("Lỗi:", err); // ← thêm
    }
}

// ===== LOGIN (hàm cũ — dùng cho trang login.html nếu có) =====
async function login() {
    const u = document.getElementById("user").value.trim();
    const p = document.getElementById("pass").value;

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (!data.ok) {
        alert("Sai tài khoản hoặc mật khẩu");
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(data.user));

    if (data.user.mustChangePassword) {
        window.location.href = "change-password.html";
    } else {
        window.location.href = "new.html";
    }
}

// ===== ADD USER (Admin) =====
async function addUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "lecturer") {
        alert("Không có quyền!");
        return;
    }

    const u = document.getElementById("newUser").value.trim();
    const p = document.getElementById("newPass").value;
    const e = document.getElementById("newEmail")?.value.trim() || u + "@student.hcmute.edu.vn";

    if (!u || !p) {
        alert("Vui lòng nhập username và password!");
        return;
    }

    const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, email: e, password: p, role: "user" })
    });

    const data = await res.json();

    if (!data.ok) {
        alert(data.message || "Thêm user thất bại!");
        return;
    }

    document.getElementById("newUser").value = "";
    document.getElementById("newPass").value = "";
    if (document.getElementById("newEmail")) document.getElementById("newEmail").value = "";

    renderUsers();
    alert("Đã thêm user!");
}

// ===== RESET PASSWORD (Admin) =====
async function resetPassword() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "lecturer") {
        alert("Không có quyền!");
        return;
    }

    const u = document.getElementById("resetUser").value.trim();
    const p = document.getElementById("resetPass").value;

    if (!u || !p) {
        alert("Vui lòng nhập username và mật khẩu mới!");
        return;
    }

    const res = await fetch(`${API}/users/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if (!data.ok) {
        alert(data.message || "Reset thất bại!");
        return;
    }

    document.getElementById("resetUser").value = "";
    document.getElementById("resetPass").value = "";
    renderUsers();
    alert("Đã reset mật khẩu!");
}

// ===== DELETE USER (Admin) =====
async function deleteUser(id) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "lecturer") {
        alert("Không có quyền!");
        return;
    }

    if (confirm("Xoá user này?")) {
        await fetch(`${API}/users/${id}`, { method: "DELETE" });
        renderUsers();
    }
}

// ===== CHANGE PASSWORD (User tự đổi) =====
async function changePassword() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const newPass = document.getElementById("newPass").value;

    if (newPass.length < 4) {
        alert("Mật khẩu >= 4 ký tự");
        return;
    }

    const res = await fetch(`${API}/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username, password: newPass })
    });

    const data = await res.json();

    if (!data.ok) {
        alert("Đổi mật khẩu thất bại!");
        return;
    }

    const updated = { ...currentUser, password: newPass, mustChangePassword: false };
    localStorage.setItem("currentUser", JSON.stringify(updated));

    alert("Đổi mật khẩu thành công!");
    window.location.href = "profile.html";
}

// ===== TÌM KIẾM USER =====
async function searchUsers() {
    const keyword = document.getElementById("searchUser").value.toLowerCase().trim();

    if (!keyword) {
        document.getElementById("userTable").style.display = "none";
        return;
    }

    const res = await fetch(`${API}/users`);
    const users = await res.json();

    const list = document.getElementById("userList");
    list.innerHTML = "";

    const filtered = users.filter(u => u.username.toLowerCase().includes(keyword));

    if (filtered.length > 0) {
        filtered.forEach(user => {
            list.innerHTML += `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>${user.mustChangePassword ? "Chưa đổi mật khẩu" : "OK"}</td>
                    <td>
                        <button onclick="deleteUser(${user.id})">Xoá</button>
                    </td>
                </tr>
            `;
        });
    } else {
        list.innerHTML = `<tr><td colspan="4" style="text-align:center;">Không tìm thấy user</td></tr>`;
    }

    document.getElementById("userTable").style.display = "table";
}

// ===== XÓA BỘ LỌC =====
function clearSearch() {
    document.getElementById("searchUser").value = "";
    document.getElementById("userTable").style.display = "table";
    renderUsers();
}