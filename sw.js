self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
});

self.addEventListener("fetch", (e) => {
  // Bỏ qua, để trình duyệt tự lo việc tải dữ liệu từ internet
});
