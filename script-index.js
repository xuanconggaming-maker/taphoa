// 1. Cấu hình Firebase (Giữ nguyên 100%)
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

let dbData = { products: [] };
let cart = [];
let lastBillNumber = 0;

// 2. Lắng nghe dữ liệu
database.ref().on("value", (s) => {
  const data = s.val() || {};
  dbData = data.store_data_v3 || { products: [] };
  lastBillNumber = data.lastBillNumber || 0;
  renderProducts();
});

// 3. Hiển thị sản phẩm (Hiển thị ảnh đẹp mắt)
// 3. Hiển thị sản phẩm (Có tính toán trừ đi số lượng đã nhặt vào giỏ)
function renderProducts() {
  const searchVal = document.getElementById("search").value.toLowerCase();
  const grid = document.getElementById("productGrid");

  const html = (dbData.products || [])
    .map((p, idx) => {
      if (!p.name.toLowerCase().includes(searchVal)) return "";

      const imgUrl =
        p.img ||
        "https://images.unsplash.com/photo-1604719312566-8fa20658f1e1?auto=format&fit=crop&q=80&w=300&h=200";

      // Lấy số lượng đã thêm vào giỏ của sản phẩm này
      const cartItem = cart.find((c) => c.idx === idx);
      const qtyInCart = cartItem ? cartItem.q : 0;

      // TỒN KHO THỰC TẾ = TỒN KHO GỐC - SỐ LƯỢNG TRONG GIỎ
      const remainingQty = p.qty - qtyInCart;

      return `
        <div class="col">
          <div class="product-card h-100" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
              
              <div style="width: 100%; height: 160px; background-color: #f0f0f0;">
                  <img src="${imgUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              
              <div style="padding: 15px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                  <div class="p-info">
                      <b>${p.name}</b>
                      <span class="p-price">${p.price.toLocaleString()}đ</span>
                      <span class="badge-stock">Tồn kho: ${remainingQty}</span>
                  </div>
                  <div class="p-action">
                      <input type="number" id="q-${idx}" value="1" min="1" max="${remainingQty}">
                      <button onclick="addToCart(${idx})" ${remainingQty <= 0 ? 'disabled style="background:gray;"' : ""}>
                        ${remainingQty <= 0 ? "HẾT HÀNG" : "THÊM"}
                      </button>
                  </div>
              </div>
          </div>
        </div>`;
    })
    .join("");

  grid.innerHTML =
    html ||
    "<div class='col-12'><p style='text-align:center; width:100%; color:#888'>Không tìm thấy sản phẩm nào</p></div>";
}

// 4. Thêm vào giỏ hàng (Đã lưu thêm link ảnh vào giỏ)
function addToCart(idx) {
  const inputEl = document.getElementById(`q-${idx}`);
  const inputQty = parseInt(inputEl.value);
  const product = dbData.products[idx];

  if (isNaN(inputQty) || inputQty <= 0) return;

  const exist = cart.find((c) => c.idx === idx);
  const currentCartQty = exist ? exist.q : 0;

  // Kiểm tra xem tổng mua có vượt tồn kho thật không
  if (currentCartQty + inputQty > product.qty) {
    alert("Số lượng vượt quá tồn kho!");
    return;
  }

  if (exist) {
    exist.q += inputQty;
  } else {
    // Lưu thêm thuộc tính img và allowDelivery vào mảng giỏ hàng
    cart.push({
      idx,
      name: product.name,
      price: product.price,
      q: inputQty,
      img: product.img,
      allowDelivery: product.allowDelivery || false, // <--- THÊM DÒNG NÀY LÀ ĐƯỢC
    });
  }

  inputEl.value = 1; // Reset ô nhập số lượng về 1 sau khi bấm thêm
  renderCart();
  renderProducts(); // Gọi lại hàm này để load lại số lượng tồn kho trên màn hình
}

// 5. Hiển thị Giỏ Hàng (Đã có Ảnh sản phẩm)
function renderCart() {
  let total = 0;
  let totalItems = 0;
  const cartDiv = document.getElementById("cartItems");

  cartDiv.innerHTML = cart
    .map((item, i) => {
      const itemTotal = item.price * item.q;
      total += itemTotal;
      totalItems += item.q;

      const imgUrl =
        item.img ||
        "https://images.unsplash.com/photo-1604719312566-8fa20658f1e1?auto=format&fit=crop&q=80&w=300&h=200";

      // Dùng Flexbox của Bootstrap để dàn ngang Ảnh - Tên - Nút xóa
      return `
        <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom">
            <img src="${imgUrl}" alt="${item.name}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 10px; margin-right: 12px; border: 1px solid #eee;">
            <div style="flex: 1; text-align: left;">
                <b style="display: block; font-size: 0.95rem; color: #1e3c72; margin-bottom: 4px;">${item.name}</b>
                <span class="text-danger fw-bold">${itemTotal.toLocaleString()}đ</span>
            </div>
            <div class="d-flex flex-column align-items-end">
                <span class="badge bg-secondary mb-1" style="font-size: 0.9rem;">x ${item.q}</span>
                <button class="btn btn-sm btn-outline-danger" style="padding: 2px 8px; font-size: 0.8rem;" onclick="removeFromCart(${i})">Xóa</button>
            </div>
        </div>`;
    })
    .join("");

  document.getElementById("totalText").innerText = total.toLocaleString() + "đ";

  const badge = document.getElementById("cartBadge");
  if (badge) badge.innerText = totalItems;

  // --- THÊM ĐOẠN LOGIC ẨN/HIỆN NÚT VÀO ĐÂY ---
  const hasDelivery = cart.some((item) => item.allowDelivery === true);
  const btnDatHang = document.getElementById("btnDatHang");
  const btnTienMat = document.getElementById("btnTienMat");
  const btnQR = document.getElementById("btnQR");

  if (btnDatHang && btnTienMat && btnQR) {
    if (hasDelivery) {
      btnDatHang.style.display = "block";
      btnTienMat.style.display = "none";
      btnQR.style.display = "none";
    } else {
      btnDatHang.style.display = "none";
      btnTienMat.style.display = "block";
      btnQR.style.display = "block";
    }
  }
  // --- KẾT THÚC ĐOẠN THÊM ---

  return total;
} // Đây là dấu đóng ngoặc } của hàm renderCart

// 6. Xóa món khỏi giỏ hàng
function removeFromCart(i) {
  cart.splice(i, 1);
  renderCart();
  renderProducts(); // Khi xóa khỏi giỏ, tồn kho trên màn hình sẽ tự động cộng lại
}

// 5. Hàm hiển thị QR (Giữ nguyên thông tin STK của bạn)
function showQR() {
  const total = renderCart();
  if (total <= 0) return alert("Giỏ hàng đang trống!");

  const billID = "HD" + (lastBillNumber + 1);
  const stk = "0386823702";
  const bank = "MB";
  const name = "CU Y AI";
  const memo = billID;

  const qrUrl = `https://img.vietqr.io/image/${bank}-${stk}-compact2.png?amount=${total}&addInfo=${memo}&accountName=${name}`;

  document.getElementById("qrImg").src = qrUrl;
  document.getElementById("qrInfo").innerHTML =
    `Mã HĐ: <b>${billID}</b> - Tổng: <b>${total.toLocaleString()}đ</b>`;
  document.getElementById("qrMemo").innerText = memo;
  document.getElementById("qrModal").style.display = "flex";
}

// 6. Xử lý thanh toán chung (Giữ nguyên logic Firebase)
function handlePay(method) {
  const sum = renderCart();
  if (cart.length === 0) return alert("Giỏ hàng trống!");

  if (!confirm(`Xác nhận thanh toán ${sum.toLocaleString()}đ bằng ${method}?`))
    return;

  const newID = lastBillNumber + 1;
  const billId = "HD" + newID;

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

function closeQR() {
  document.getElementById("qrModal").style.display = "none";
}

// ==========================================
// CÁC HÀM XỬ LÝ ĐẶT HÀNG GIAO TẬN NƠI
// ==========================================
function openOrderModal() {
  const sum = renderCart();
  document.getElementById("orderModalTotal").innerText =
    sum.toLocaleString() + "đ";

  // Đóng giỏ hàng Offcanvas của Bootstrap để mở Modal cho đỡ vướng
  const offcanvasEl = document.getElementById("cartOffcanvas");
  if (offcanvasEl) {
    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (offcanvas) offcanvas.hide();
  }

  document.getElementById("orderModal").style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
}

function submitOrder(e) {
  e.preventDefault();

  const sum = renderCart();
  if (cart.length === 0) return alert("Giỏ hàng trống!");

  const name = document.getElementById("cusName").value;
  const phone = document.getElementById("cusPhone").value;
  const address = document.getElementById("cusAddress").value;

  const newID = lastBillNumber + 1;
  const billId = "GH" + newID; // Ký hiệu GH = Giao Hàng

  // Trừ số lượng tồn kho
  cart.forEach((c) => {
    dbData.products[c.idx].qty -= c.q;
  });

  // Ghi lại lịch sử
  const history = {
    billId: billId,
    method: "Giao Hàng",
    total: sum,
    time: new Date().toLocaleString("vi-VN"),
    details:
      `Khách: ${name} - SĐT: ${phone} - Đ/C: ${address}. Đơn: ` +
      cart.map((c) => `${c.name}(x${c.q})`).join(", "),
  };

  const updates = {};
  updates["/store_data_v3/"] = dbData;
  updates["/sales_history/" + billId] = history;
  updates["/lastBillNumber"] = newID;

  // Hiệu ứng Loading nút bấm
  const btnSubmit = document.querySelector("#orderForm button[type='submit']");
  btnSubmit.innerText = "⏳ ĐANG XỬ LÝ...";
  btnSubmit.disabled = true;

  database
    .ref()
    .update(updates)
    .then(() => {
      alert(
        `Đã gửi đơn hàng thành công!\nTạp Hóa Ái Cử sẽ sớm giao hàng đến cho ${name}.`,
      );
      cart = [];
      renderCart();
      renderProducts(); // Load lại giao diện để trừ kho thực tế
      closeOrderModal();
      document.getElementById("orderForm").reset();
    })
    .catch((err) => {
      alert("Lỗi kết nối Firebase: " + err.message);
    })
    .finally(() => {
      btnSubmit.innerText = "XÁC NHẬN ĐẶT HÀNG";
      btnSubmit.disabled = false;
    });
}
