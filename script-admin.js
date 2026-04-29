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
let editIndex = -1; // -1 nghĩa là đang thêm mới, >= 0 nghĩa là đang sửa
let previousOrderCount = -1; // Dùng để theo dõi số lượng đơn hàng

// 2. Lắng nghe dữ liệu (Realtime)
database.ref().on(
  "value",
  (snapshot) => {
    const data = snapshot.val() || {};
    localDB = data.store_data_v3 || { products: [] };
    if (!Array.isArray(localDB.products)) localDB.products = [];

    // --- LOGIC PHÁT HIỆN ĐƠN MỚI VÀ RUNG CHUÔNG ---
    const historyObj = data.sales_history || {};
    const currentOrderCount = Object.keys(historyObj).length;

    // Nếu không phải lần load đầu tiên VÀ số đơn tăng lên
    if (previousOrderCount !== -1 && currentOrderCount > previousOrderCount) {
      triggerAlarm(); // Réo chuông!
    }
    previousOrderCount = currentOrderCount;
    // ---------------------------------------------

    renderInventory();
    renderSalesHistory(historyObj);
  },
  (error) => {
    alert("Không thể kết nối cơ sở dữ liệu!");
  },
);
// 3. Hàm Thêm Sản Phẩm (Đã thêm xử lý link ảnh)
// 3. Hàm Thêm / Cập Nhật Sản Phẩm
function addNewProduct() {
  const nameInput = document.getElementById("pName");
  const imgInput = document.getElementById("pImg");
  const priceInput = document.getElementById("pPrice");
  const qtyInput = document.getElementById("pQty");

  const name = nameInput.value.trim();
  const price = parseInt(priceInput.value);
  const qty = parseFloat(qtyInput.value) || 0;
  const img =
    imgInput.value.trim() ||
    "https://images.unsplash.com/photo-1604719312566-8fa20658f1e1?auto=format&fit=crop&q=80&w=300&h=200";
  const allowDelivery = document.getElementById("pDelivery").checked;

  if (!name) return alert("Vui lòng nhập tên sản phẩm!");
  if (isNaN(price) || price <= 0)
    return alert("Giá sản phẩm phải là số dương!");

  const btn = document.getElementById("btnAddProduct");
  btn.disabled = true;
  btn.innerText = "⏳ ĐANG LƯU...";

  if (editIndex > -1) {
    localDB.products[editIndex].name = name;
    localDB.products[editIndex].price = price;
    localDB.products[editIndex].qty = qty;
    localDB.products[editIndex].img = img;
    // Dòng mới thêm:
    localDB.products[editIndex].allowDelivery = allowDelivery;
  } else {
    // Sửa dòng push này để thêm allowDelivery:
    localDB.products.push({
      name: name,
      price: price,
      qty: qty,
      img: img,
      allowDelivery: allowDelivery,
    });
  }

  database
    .ref("store_data_v3")
    .set(localDB)
    .then(() => {
      alert(
        editIndex > -1
          ? "Đã cập nhật sản phẩm thành công!"
          : "Đã thêm thành công: " + name,
      );

      // Reset lại form sau khi lưu
      nameInput.value = "";
      nameInput.disabled = false; // Mở khóa lại ô nhập tên
      imgInput.value = "";
      priceInput.value = "";
      qtyInput.value = "";
      document.getElementById("pDelivery").checked = false; // <-- BẠN THÊM DÒNG NÀY VÀO ĐÂY NHÉ

      // Trả nút bấm về trạng thái ban đầu
      editIndex = -1;
      btn.innerHTML = "➕ XÁC NHẬN THÊM";
      btn.style.background = ""; // Khôi phục màu gốc
    })
    .catch((err) => alert("Lỗi: " + err.message))
    .finally(() => {
      btn.disabled = false;
    });
}

// 3.5. Hàm kích hoạt chế độ Sửa (Mới)
function editProduct(i) {
  const p = localDB.products[i];

  // Đưa dữ liệu lên form
  document.getElementById("pName").value = p.name;
  document.getElementById("pName").disabled = false; // MỞ KHÓA CHO SỬA TÊN

  document.getElementById("pImg").value = p.img || "";
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pQty").value = p.qty;
  document.getElementById("pDelivery").checked = p.allowDelivery || false;
  editIndex = i; // Đánh dấu đang sửa sản phẩm vị trí thứ i

  // Đổi giao diện nút bấm thành Cập nhật
  const btn = document.getElementById("btnAddProduct");
  btn.innerHTML = "💾 CẬP NHẬT SẢN PHẨM";
  btn.style.background = "linear-gradient(135deg, #f39c12, #e67e22)"; // Đổi nút sang màu cam báo hiệu đang sửa

  // Tự động cuộn trang lên trên cùng để người dùng thấy form
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 4. Hiển thị bảng hàng (Đã fix lỗi STT và thêm nút Sửa)
function renderInventory() {
  const tbody = document.getElementById("inventoryBody");
  if (localDB.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có hàng trong kho</td></tr>`;
    return;
  }

  tbody.innerHTML = localDB.products
    .map((p, i) => {
      const qtyStyle =
        p.qty <= 0
          ? "color: red; font-weight: bold;"
          : "color: #27ae60; font-weight: bold;";

      return `
        <tr>
            <td style="font-weight: bold; color: #1e3c72; text-align: center;">${i + 1}</td>
            
            <td style="display: flex; align-items: center; gap: 10px;">
              <img src="${p.img || "https://via.placeholder.com/50"}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
              <b>${p.name}</b>
            </td>
            
            <td style="color: #e74c3c; font-weight: 600;">${p.price.toLocaleString()}đ</td>
            <td style="${qtyStyle}">${p.qty}</td>
            
            <td>
              <div style="display: flex; gap: 5px;">
                <button class="btn-edit" onclick="editProduct(${i})">✏️ Sửa</button>
                <button class="btn-delete" onclick="deleteProduct(${i})">🗑️ Xóa</button>
              </div>
            </td>
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

  let normalHtml = "";
  let deliveryHtml = "";

  historyList.forEach((h) => {
    const amount = parseInt(h.total) || 0;

    if (h.time && h.time.includes(todayStr)) daySum += amount;
    if (h.time && h.time.includes(monthYearStr)) monthSum += amount;

    // PHÂN LOẠI ĐƠN HÀNG
    if (h.method === "Giao Hàng") {
      deliveryHtml += `
        <tr style="background: #fffdf0; border-bottom: 2px solid #eee;">
            <td style="color: #7f8c8d; font-size: 0.85rem;">${h.time}</td>
            <td><b style="color:#d35400;">${h.billId}</b></td>
            <td style="color: #34495e; font-size: 0.95rem; line-height: 1.5;">
              ${h.details} <br> 
              <b style="color: #e74c3c; font-size: 1.1rem;">Tổng thu: ${amount.toLocaleString()}đ</b>
            </td>
            <td>
              <button onclick="alert('Đã ghi nhận đang chuẩn bị đơn ${h.billId}')" class="btn-edit" style="background:#27ae60; color:white; width: 100%;">Chuẩn bị hàng</button>
            </td>
        </tr>`;
    } else {
      const methodIcon = h.method === "Tiền mặt" ? "💵" : "💳";
      normalHtml += `
        <tr>
            <td style="color: #7f8c8d; font-size: 0.85rem;">${h.time || "N/A"}</td>
            <td><b style="color:#1e3c72;">${h.billId || "HD"}</b> <br> <small>${methodIcon} ${h.method || ""}</small></td>
            <td style="color: #e74c3c; font-weight: bold;">${amount.toLocaleString()}đ</td>
            <td style="color: #34495e; font-size: 0.9rem;">${h.details || ""}</td>
        </tr>`;
    }
  });

  // Đổ dữ liệu vào 2 bảng khác nhau
  document.getElementById("historyBody").innerHTML =
    normalHtml ||
    `<tr><td colspan="4" class="text-center">Chưa có giao dịch tại quầy</td></tr>`;

  const deliveryBody = document.getElementById("deliveryBody");
  if (deliveryBody) {
    deliveryBody.innerHTML =
      deliveryHtml ||
      `<tr><td colspan="4" class="text-center">Chưa có đơn hàng giao tận nơi</td></tr>`;
  }

  document.getElementById("totalDay").innerText = daySum.toLocaleString() + "đ";
  document.getElementById("totalMonth").innerText =
    monthSum.toLocaleString() + "đ";
}
// --- CÁC HÀM XỬ LÝ CHUÔNG BÁO ---
function triggerAlarm() {
  const audio = document.getElementById("alarmSound");
  const card = document.getElementById("deliveryCard");
  const btn = document.getElementById("btnStopSound");

  if (audio)
    audio
      .play()
      .catch((e) => console.log("Lỗi trình duyệt chặn tự phát âm thanh:", e));
  if (card) {
    card.classList.add("alert-mode");
    // Tự động cuộn trang xuống chỗ bảng giao hàng
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (btn) btn.style.display = "block";
}

function stopAlarm() {
  const audio = document.getElementById("alarmSound");
  const card = document.getElementById("deliveryCard");
  const btn = document.getElementById("btnStopSound");

  if (audio) {
    audio.pause();
    audio.currentTime = 0; // Trả âm thanh về đầu
  }
  if (card) card.classList.remove("alert-mode");
  if (btn) btn.style.display = "none";
}
