// 1. Cấu hình Firebase (Phải khớp 100% với Admin)
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

// Biến lưu trữ dữ liệu
let dbData = { products: [] };
let cart = [];
let lastBillNumber = 0;

// ==========================================
// 2. ĐOẠN CODE ĐỒNG BỘ ĐÂY (TRẠM THU DỮ LIỆU)
// ==========================================
database.ref().on("value", (s) => {
  const data = s.val() || {};
  // Lấy dữ liệu sản phẩm từ Admin (store_data_v3)
  dbData = data.store_data_v3 || { products: [] };
  // Lấy số hóa đơn cuối cùng
  lastBillNumber = data.lastBillNumber || 0;

  console.log("Dữ liệu đã đồng bộ từ Admin!");
  renderProducts(); // Tự động vẽ lại danh sách khi Admin thay đổi
});

// 3. Hiển thị sản phẩm ra màn hình
function renderProducts() {
  const searchVal = document.getElementById("search").value.toLowerCase();
  const grid = document.getElementById("productGrid");

  // Lọc sản phẩm theo tìm kiếm và chỉ hiện sản phẩm còn hàng
  const html = (dbData.products || [])
    .map((p, idx) => {
      if (!p.name.toLowerCase().includes(searchVal)) return "";

      return `
        <div class="product-card">
            <div class="p-info">
                <b>${p.name}</b>
                <span class="p-price">${p.price.toLocaleString()}đ</span>
                <small>Còn lại: ${p.qty}</small>
            </div>
            <div class="p-action">
                <input type="number" id="q-${idx}" value="1" min="1" max="${p.qty}">
                <button onclick="addToCart(${idx})">THÊM</button>
            </div>
        </div>`;
    })
    .join("");

  grid.innerHTML = html || "<p>Không tìm thấy sản phẩm nào</p>";
}

// 4. Thêm vào giỏ hàng
function addToCart(idx) {
  const inputQty = parseInt(document.getElementById(`q-${idx}`).value);
  const product = dbData.products[idx];

  if (inputQty > product.qty) {
    alert("Số lượng tồn kho không đủ!");
    return;
  }

  const exist = cart.find((c) => c.idx === idx);
  if (exist) {
    if (exist.q + inputQty > product.qty) {
      alert("Vượt quá số lượng trong kho!");
      return;
    }
    exist.q += inputQty;
  } else {
    cart.push({ idx, name: product.name, price: product.price, q: inputQty });
  }
  renderCart();
}

// 5. Hiển thị giỏ hàng
function renderCart() {
  let total = 0;
  const cartDiv = document.getElementById("cartItems");

  cartDiv.innerHTML = cart
    .map((item, i) => {
      const itemTotal = item.price * item.q;
      total += itemTotal;
      return `
        <div class="cart-item">
            <span>${item.name} x ${item.q}</span>
            <span>${itemTotal.toLocaleString()}đ <button onclick="removeFromCart(${i})">❌</button></span>
        </div>`;
    })
    .join("");

  document.getElementById("totalText").innerText = total.toLocaleString() + "đ";
  return total;
}

function removeFromCart(i) {
  cart.splice(i, 1);
  renderCart();
}

// 6. Thanh toán và ĐỒNG BỘ NGƯỢC LẠI ADMIN
f; // 1. Hàm hiển thị QR (Sửa lỗi bấm nút "Quét mã QR")
function showQR() {
  const total = renderCart();
  if (total <= 0) return alert("Giỏ hàng đang trống!");

  const billID = "HD" + (lastBillNumber + 1);
  const stk = "0386823702"; // Số tài khoản MB của bạn
  const bank = "MB";
  const name = "CU Y AI"; // Tên tài khoản của bạn (không dấu)
  const memo = billID; // Nội dung chuyển khoản là mã hóa đơn

  // Link API VietQR để tạo mã tự động
  const qrUrl = `https://img.vietqr.io/image/${bank}-${stk}-compact2.png?amount=${total}&addInfo=${memo}&accountName=${name}`;

  // Khớp các ID với file HTML mới
  document.getElementById("qrImg").src = qrUrl;
  document.getElementById("qrInfo").innerHTML =
    `Mã HĐ: <b>${billID}</b> - Tổng: <b>${total.toLocaleString()}đ</b>`;
  document.getElementById("qrMemo").innerText = memo; // Nội dung HĐ sẽ hiện ở đây
  document.getElementById("qrModal").style.display = "flex";
}
// 2. Hàm xử lý thanh toán chung (Sửa lỗi bấm nút "Tiền mặt")
function handlePay(method) {
  const sum = renderCart();
  if (cart.length === 0) return alert("Giỏ hàng trống!");

  if (!confirm(`Xác nhận thanh toán ${sum.toLocaleString()}đ bằng ${method}?`))
    return;

  const newID = lastBillNumber + 1;
  const billId = "HD" + newID;

  // Trừ kho
  cart.forEach((c) => {
    dbData.products[c.idx].qty -= c.q;
  });

  const history = {
    billId: billId,
    method: method,
    total: sum,
    time: new Date().toLocaleString("vi-VN"),
    details: cart.map((c) => `${c.name}(x${c.q})`).join(", "),
  };

  // Đẩy dữ liệu lên Firebase
  const updates = {};
  updates["/store_data_v3/"] = dbData;
  updates["/sales_history/" + billId] = history;
  updates["/lastBillNumber"] = newID;

  database
    .ref()
    .update(updates)
    .then(() => {
      alert("Thanh toán thành công!");
      cart = [];
      renderCart();
      if (method === "Chuyển khoản") closeQR();
    })
    .catch((err) => {
      alert("Lỗi kết nối Firebase: " + err.message);
    });
}

// 3. Đảm bảo có hàm đóng Modal
function closeQR() {
  document.getElementById("qrModal").style.display = "none";
}
