// Thiết lập mật khẩu quản lý tại đây
const correctPass = "1234";

function checkAdminPass() {
  const input = document.getElementById("adminPass").value;
  const lockScreen = document.getElementById("adminLock");
  const errorText = document.getElementById("lockError");

  if (input === correctPass) {
    // Nếu đúng mật khẩu, ẩn màn hình khóa và lưu trạng thái vào Session
    lockScreen.style.display = "none";
    sessionStorage.setItem("isAdmin", "true");
  } else {
    errorText.style.display = "block";
    document.getElementById("adminPass").value = "";
  }
}

// Kiểm tra nếu đã đăng nhập trước đó trong cùng một phiên làm việc (session)
window.onload = function () {
  if (sessionStorage.getItem("isAdmin") === "true") {
    document.getElementById("adminLock").style.display = "none";
  }
};

// Cho phép nhấn phím Enter để đăng nhập
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

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Biến cục bộ để lưu trữ dữ liệu tạm thời
let localDB = { products: [] };

// 2. Lắng nghe dữ liệu thay đổi từ Firebase (Realtime)
database.ref().on(
  "value",
  (snapshot) => {
    const data = snapshot.val() || {};
    console.log("Dữ liệu mới nhận từ Firebase:", data);

    // Cập nhật dữ liệu hàng hóa
    localDB = data.store_data_v3 || { products: [] };
    if (!Array.isArray(localDB.products)) localDB.products = [];

    renderInventory();
    renderSalesHistory(data.sales_history || {});
  },
  (error) => {
    console.error("Lỗi kết nối Firebase:", error);
    alert("Không thể kết nối cơ sở dữ liệu!");
  },
);

// 3. Hàm Thêm Sản Phẩm Mới
function addNewProduct() {
  const nameInput = document.getElementById("pName");
  const priceInput = document.getElementById("pPrice");
  const qtyInput = document.getElementById("pQty");

  const name = nameInput.value.trim();
  const price = parseInt(priceInput.value);
  const qty = parseFloat(qtyInput.value) || 0;

  // Kiểm tra hợp lệ
  if (!name) {
    alert("Vui lòng nhập tên sản phẩm!");
    return;
  }
  if (isNaN(price) || price <= 0) {
    alert("Giá sản phẩm phải là số dương!");
    return;
  }

  // Vô hiệu hóa nút để tránh bấm nhiều lần
  const btn = document.getElementById("btnAddProduct");
  btn.disabled = true;
  btn.innerText = "ĐANG LƯU...";

  // Cập nhật mảng sản phẩm
  localDB.products.push({ name, price, qty });

  // Lưu lên Firebase
  database
    .ref("store_data_v3")
    .set(localDB)
    .then(() => {
      alert("Đã thêm thành công: " + name);
      // Xóa trắng ô nhập
      nameInput.value = "";
      priceInput.value = "";
      qtyInput.value = "";
    })
    .catch((err) => {
      console.error("Lỗi khi lưu:", err);
      alert("Lỗi: " + err.message);
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerText = "XÁC NHẬN THÊM";
    });
}

// 4. Hiển thị bảng hàng tồn kho
function renderInventory() {
  const tbody = document.getElementById("inventoryBody");
  if (localDB.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">Chưa có hàng trong kho</td></tr>`;
    return;
  }

  tbody.innerHTML = localDB.products
    .map(
      (p, i) => `
        <tr>
            <td><b>${p.name}</b></td>
            <td>${p.price.toLocaleString()}đ</td>
            <td>${p.qty}</td>
            <td><button onclick="deleteProduct(${i})" style="color:red; background:none; border:none; cursor:pointer; font-size:18px">✖</button></td>
        </tr>
    `,
    )
    .join("");
}

// 5. Xóa sản phẩm
function deleteProduct(i) {
  if (confirm(`Bạn chắc chắn muốn xóa "${localDB.products[i].name}"?`)) {
    localDB.products.splice(i, 1);
    database.ref("store_data_v3").set(localDB);
  }
}

// 6. Hiển thị doanh thu và lịch sử
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

      // Tính toán doanh thu ngày/tháng
      if (h.time && h.time.includes(todayStr)) {
        daySum += amount;
      }
      if (h.time && h.time.includes(monthYearStr)) {
        monthSum += amount;
      }

      return `<tr>
            <td><small>${h.time || "N/A"}</small></td>
            <td><b>${h.billId || "HD"}</b></td>
            <td>${amount.toLocaleString()}đ</td>
            <td><small>${h.details || ""}</small></td>
        </tr>`;
    })
    .join("");

  document.getElementById("historyBody").innerHTML =
    html ||
    `<tr><td colspan="4" style="text-align:center">Chưa có giao dịch</td></tr>`;
  document.getElementById("totalDay").innerText = daySum.toLocaleString() + "đ";
  document.getElementById("totalMonth").innerText =
    monthSum.toLocaleString() + "đ";
}
