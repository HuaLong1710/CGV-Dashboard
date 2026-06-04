/* Format tiền */
function formatVND(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

module.exports = {
  formatVND,
};