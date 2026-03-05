// Thiết lập mật khẩu quản lý tại đây
const correctPass = "1985";

function checkAdminPass() {
  const input = document.getElementById("adminPass").value;
  const lockScreen = document.getElementById("adminLock");
  const errorText = document.getElementById("lockError");

  if (input === correctPass) {
    lockScreen.style.display = "none";
    sessionStorage.setItem("isAdmin", "true");
  } else {
    errorText.style.display = "block";
    document.getElementById("adminPass").value = "";
  }
}

// Kiểm tra phiên làm việc
window.onload = function () {
  if (sessionStorage.getItem("isAdmin") === "true") {
    document.getElementById("adminLock").style.display = "none";
  }
};

// Cho phép Enter
document.addEventListener("keypress", function (e) {
  if (
    e.key === "Enter" &&
    document.getElementById("adminLock").style.display !== "none"
  ) {
    checkAdminPass();
  }
});

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA_1WA2ArsM0_atwF2BmtSBw_hl6g2GUJE",
  authDomain: "tap-hoa-ai-cu.firebaseapp.com",
  databaseURL:
    "https://tap-hoa-ai-cu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tap-hoa-ai-cu",
  storageBucket: "tap-hoa-ai-cu.firebasestorage.app",
  messagingSenderId: "610047403458",
  appId: "1:610047403458:web:b5d320ea25e18393c6625b",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let localDB = { products: [] };

// 2. Lắng nghe dữ liệu (Realtime)
database.ref().on(
  "value",
  (snapshot) => {
    const data = snapshot.val() || {};
    localDB = data.store_data_v3 || { products: [] };
    if (!Array.isArray(localDB.products)) localDB.products = [];

    renderInventory();
    renderSalesHistory(data.sales_history || {});
  },
  (error) => {
    alert("Không thể kết nối cơ sở dữ liệu!");
  },
);

// 3. Hàm Thêm
function addNewProduct() {
  const nameInput = document.getElementById("pName");
  const priceInput = document.getElementById("pPrice");
  const qtyInput = document.getElementById("pQty");

  const name = nameInput.value.trim();
  const price = parseInt(priceInput.value);
  const qty = parseFloat(qtyInput.value) || 0;

  if (!name) return alert("Vui lòng nhập tên sản phẩm!");
  if (isNaN(price) || price <= 0)
    return alert("Giá sản phẩm phải là số dương!");

  const btn = document.getElementById("btnAddProduct");
  btn.disabled = true;
  btn.innerText = "⏳ ĐANG LƯU...";

  localDB.products.push({ name, price, qty });

  database
    .ref("store_data_v3")
    .set(localDB)
    .then(() => {
      alert("Đã thêm thành công: " + name);
      nameInput.value = "";
      priceInput.value = "";
      qtyInput.value = "";
    })
    .catch((err) => alert("Lỗi: " + err.message))
    .finally(() => {
      btn.disabled = false;
      btn.innerText = "➕ XÁC NHẬN THÊM";
    });
}

// 4. Hiển thị bảng hàng
function renderInventory() {
  const tbody = document.getElementById("inventoryBody");
  if (localDB.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Chưa có hàng trong kho</td></tr>`;
    return;
  }

  tbody.innerHTML = localDB.products
    .map((p, i) => {
      // Highlight màu đỏ nếu hết hàng
      const qtyStyle =
        p.qty <= 0
          ? "color: red; font-weight: bold;"
          : "color: #27ae60; font-weight: bold;";

      return `
        <tr>
            <td><b>${p.name}</b></td>
            <td style="color: #e74c3c; font-weight: 600;">${p.price.toLocaleString()}đ</td>
            <td style="${qtyStyle}">${p.qty}</td>
            <td><button class="btn-delete" onclick="deleteProduct(${i})">🗑️ Xóa</button></td>
        </tr>
      `;
    })
    .join("");
}

// 5. Xóa sản phẩm
function deleteProduct(i) {
  if (
    confirm(`Bạn chắc chắn muốn xóa "${localDB.products[i].name}" khỏi kho?`)
  ) {
    localDB.products.splice(i, 1);
    database.ref("store_data_v3").set(localDB);
  }
}

// 6. Hiển thị lịch sử
function renderSalesHistory(historyObj) {
  let daySum = 0;
  let monthSum = 0;
  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const monthYearStr = `/${now.getMonth() + 1}/${now.getFullYear()}`;

  const historyList = Object.values(historyObj).reverse();

  const html = historyList
    .map((h) => {
      const amount = parseInt(h.total) || 0;

      if (h.time && h.time.includes(todayStr)) daySum += amount;
      if (h.time && h.time.includes(monthYearStr)) monthSum += amount;

      // Icon phương thức thanh toán
      const methodIcon = h.method === "Tiền mặt" ? "💵" : "💳";

      return `<tr>
            <td style="color: #7f8c8d; font-size: 0.85rem;">${h.time || "N/A"}</td>
            <td><b style="color:#1e3c72;">${h.billId || "HD"}</b> <br> <small>${methodIcon} ${h.method || ""}</small></td>
            <td style="color: #e74c3c; font-weight: bold;">${amount.toLocaleString()}đ</td>
            <td style="color: #34495e; font-size: 0.9rem;">${h.details || ""}</td>
        </tr>`;
    })
    .join("");

  document.getElementById("historyBody").innerHTML =
    html ||
    `<tr><td colspan="4" class="text-center">Chưa có giao dịch</td></tr>`;
  document.getElementById("totalDay").innerText = daySum.toLocaleString() + "đ";
  document.getElementById("totalMonth").innerText =
    monthSum.toLocaleString() + "đ";
}
