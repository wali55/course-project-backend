const crypto = require("crypto");
const { ID_ELEMENTS } = require("../types/idformat");

class IdGenerator {
  static generateElement(element, options = {}) {
    const { type, value, format } = element;

    switch (type) {
      case ID_ELEMENTS.FIXED_TEXT:
        return value || "";
      case ID_ELEMENTS.RANDOM_20:
        return this.randomNumber(20, format?.leadingZeros);
      case ID_ELEMENTS.RANDOM_32:
        return this.randomNumber(32, format?.leadingZeros);
      case ID_ELEMENTS.RANDOM_6:
        return this.randomNumber(6, format?.leadingZeros, 6);
      case ID_ELEMENTS.GUID:
        return crypto.randomUUID();
      case ID_ELEMENTS.DATETIME:
        return this.formatDateTime(
          new Date(),
          format?.dateFormat || "YYYYMMDD"
        );
      case ID_ELEMENTS.SEQUENCE:
        return this.formatSequence(
          options.sequenceNumber,
          format?.leadingZeros
        );
      default:
        return "";
    }
  }

  static randomNumber(bits, leadingZeros = false, digits = null) {
    let max = digits ? Math.pow(10, digits) - 1 : Math.pow(2, bits) - 1;
    const num = Math.floor(Math.random() * max) + 1;
    return leadingZeros && digits
      ? num.toString().padStart(digits, "0")
      : num.toString();
  }

  static formatDateTime(date, format) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");

    return format
      .replace("YYYY", year)
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hour)
      .replace("mm", minute);
  }

  static formatSequence(num, leadingZeros = false, width = 4) {
    return leadingZeros ? num.toString().padStart(width, "0") : num.toString();
  }

  static async generateCustomId(inventoryId, idFormat, prisma) {
    const itemCount = await prisma.inventoryItem.count({
      where: { inventoryId },
    });
    const sequenceNumber = itemCount + 1;

    const parts = idFormat.elements.map((element) =>
      this.generateElement(element, { sequenceNumber })
    );
    return parts.join("");
  }

  static generatePreview(idFormat) {
    const parts = idFormat.elements.map((element) =>
      this.generateElement(element, { sequenceNumber: 42 })
    );
    return parts.join("");
  }
}

module.exports = { IdGenerator };
