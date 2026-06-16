package com.example.WebApartment.Service;

import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietHoaDon;
import com.example.WebApartment.Models.GoiDangBai;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.NguoiDung;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class InvoicePdfService {
    private static final float MARGIN = 42F;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    private static final float DEFAULT_LINE_HEIGHT = 14F;
    private static final String BRAND_NAME = "DThang Home";
    private static final String[] REGULAR_FONT_PATHS = {
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf"
    };
    private static final String[] BOLD_FONT_PATHS = {
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/tahomabd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    };

    public byte[] buildCustomerPaymentInvoice(HoaDon hoaDon, List<ChiTietHoaDon> details) throws IOException {
        return buildInvoice(
                hoaDon,
                normalizeDetails(details),
                "HÓA ĐƠN THANH TOÁN",
                "Hóa đơn thanh toán",
                receiverInfo("Khách hàng", hoaDon != null ? hoaDon.getNguoiDung() : null),
                paymentInfo(hoaDon),
                false
        );
    }

    public byte[] buildLandlordRentInvoice(HoaDon hoaDon, ChiTietHoaDon detail) throws IOException {
        List<ChiTietHoaDon> details = detail == null ? List.of() : List.of(detail);
        NguoiDung landlord = detail != null
                && detail.getBaiDang() != null
                ? detail.getBaiDang().getNguoiDung()
                : null;

        return buildInvoice(
                hoaDon,
                details,
                "PHIẾU GHI NHẬN DOANH THU",
                "Doanh thu căn hộ đã được thanh toán",
                receiverInfo("Người cho thuê", landlord),
                paymentInfo(hoaDon),
                true
        );
    }

    private byte[] buildInvoice(
            HoaDon hoaDon,
            List<ChiTietHoaDon> details,
            String title,
            String subtitle,
            List<InfoLine> receiverInfo,
            List<InfoLine> paymentInfo,
            boolean landlordCopy
    ) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            FontSet fonts = loadFonts(document);
            PdfCanvas canvas = new PdfCanvas(document, fonts);

            canvas.drawHeader(title, subtitle, hoaDon);
            canvas.drawSectionTitle("THÔNG TIN HÓA ĐƠN");
            canvas.drawTwoColumnInfo(receiverInfo, paymentInfo);

            canvas.drawSectionTitle("CHI TIẾT THANH TOÁN");
            drawItemsTable(canvas, hoaDon, details, landlordCopy);
            drawTotals(canvas, hoaDon, details, landlordCopy);
            drawFooter(canvas, landlordCopy);

            canvas.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void drawItemsTable(
            PdfCanvas canvas,
            HoaDon hoaDon,
            List<ChiTietHoaDon> details,
            boolean landlordCopy
    ) throws IOException {
        float[] widths = {36F, 72F, 210F, 42F, 88F, 90F};
        String[] headers = {"STT", "Mã", "Nội dung", "SL", "Đơn giá", "Thành tiền"};
        canvas.drawTableHeader(widths, headers);

        List<InvoiceLine> lines = buildInvoiceLines(hoaDon, details);
        for (int i = 0; i < lines.size(); i++) {
            InvoiceLine line = lines.get(i);
            canvas.drawTableRow(
                    widths,
                    List.of(
                            String.valueOf(i + 1),
                            line.code(),
                            line.description(),
                            String.valueOf(line.quantity()),
                            formatCurrency(line.unitPrice()),
                            formatCurrency(line.amount())
                    ),
                    List.of(false, false, false, true, true, true),
                    i % 2 == 0
            );
        }

        if (lines.isEmpty()) {
            canvas.drawTableRow(
                    widths,
                    List.of(
                            "1",
                            safe(hoaDon != null ? hoaDon.getMaHoaDon() : "-"),
                            formatInvoiceType(hoaDon != null ? hoaDon.getLoaiHoaDon() : null),
                            "1",
                            formatCurrency(resolveInvoiceAmount(hoaDon)),
                            formatCurrency(resolveInvoiceAmount(hoaDon))
                    ),
                    List.of(false, false, false, true, true, true),
                    true
            );
        }

        if (landlordCopy) {
            canvas.moveY(-4F);
            canvas.drawText("Doanh thu của căn hộ này đã được cộng vào ví người cho thuê.", MARGIN, canvas.getY(), 10F, false);
            canvas.moveY(-18F);
        }
    }

    private void drawTotals(
            PdfCanvas canvas,
            HoaDon hoaDon,
            List<ChiTietHoaDon> details,
            boolean landlordCopy
    ) throws IOException {
        double total = landlordCopy
                ? details.stream().mapToDouble(this::resolveAmount).sum()
                : resolveInvoiceAmount(hoaDon);

        float labelX = PAGE_WIDTH - MARGIN - 220F;
        float valueX = PAGE_WIDTH - MARGIN - 8F;
        canvas.ensureSpace(106F);
        canvas.moveY(-10F);
        canvas.drawAmountLine("Tạm tính", total, labelX, valueX, false);
        canvas.drawAmountLine("Giảm giá", 0D, labelX, valueX, false);
        canvas.drawAmountLine(landlordCopy ? "Doanh thu ghi nhận" : "Tổng thanh toán", total, labelX, valueX, true);

        canvas.moveY(-18F);
        canvas.drawPaidStamp(PAGE_WIDTH - MARGIN - 156F, canvas.getY() - 42F);
        canvas.drawText("Trạng thái: ĐÃ THANH TOÁN", MARGIN, canvas.getY(), 10F, true);
        canvas.moveY(-16F);
        canvas.drawText("Phương thức: Chuyển khoản ngân hàng / SePay", MARGIN, canvas.getY(), 10F, false);
        canvas.moveY(-16F);
        canvas.drawText("Nội dung chuyển khoản: " + safe(hoaDon != null ? hoaDon.getNoiDungChuyenKhoan() : "-"), MARGIN, canvas.getY(), 10F, false);
        canvas.moveY(-40F);
    }

    private void drawFooter(PdfCanvas canvas, boolean landlordCopy) throws IOException {
        canvas.ensureSpace(112F);

        canvas.drawHorizontalLine(
                MARGIN,
                PAGE_WIDTH - MARGIN,
                canvas.getY(),
                0.7F,
                Color.LIGHT_BORDER
        );

        canvas.moveY(-20F);

        // Đen đậm
        canvas.setColor(Color.BLACK);

        canvas.drawText(
                "Hóa đơn được tạo tự động bởi DThang Home. Vui lòng lưu giữ chứng từ này để đối chiếu khi cần.",
                MARGIN,
                canvas.getY(),
                9.5F,
                false
        );

        canvas.moveY(-44F);

        float leftCenter = MARGIN + 95F;
        float rightCenter = PAGE_WIDTH - MARGIN - 95F;

        // Đen đậm
        canvas.setColor(Color.BLACK);

        canvas.drawCenteredText(
                landlordCopy ? "Người cho thuê" : "Người thanh toán",
                leftCenter,
                canvas.getY(),
                10F,
                true
        );

        canvas.drawCenteredText(
                BRAND_NAME,
                rightCenter,
                canvas.getY(),
                10F,
                true
        );

        canvas.moveY(-16F);

        canvas.drawCenteredText(
                "(Ký, ghi rõ họ tên)",
                leftCenter,
                canvas.getY(),
                9F,
                false
        );

        canvas.drawCenteredText(
                "(Xác nhận tự động)",
                rightCenter,
                canvas.getY(),
                9F,
                false
        );
    }

    private List<InvoiceLine> buildInvoiceLines(HoaDon hoaDon, List<ChiTietHoaDon> details) {
        if (details != null && !details.isEmpty()) {
            return details.stream()
                    .map(item -> {
                        BaiDang baiDang = item.getBaiDang();
                        int quantity = item.getSoLuong() != null && item.getSoLuong() > 0 ? item.getSoLuong() : 1;
                        double unitPrice = item.getDonGia() != null ? item.getDonGia() : resolveAmount(item) / quantity;
                        return new InvoiceLine(
                                safe(baiDang != null ? baiDang.getMaBaiDang() : "-"),
                                safe(baiDang != null ? baiDang.getTieuDe() : "Căn hộ"),
                                quantity,
                                unitPrice,
                                resolveAmount(item)
                        );
                    })
                    .toList();
        }

        if (hoaDon != null && hoaDon.getGoiDangBai() != null) {
            GoiDangBai goiDangBai = hoaDon.getGoiDangBai();
            return List.of(new InvoiceLine(
                    safe(goiDangBai.getMaGoiDangBai()),
                    safe(goiDangBai.getTenGoi()),
                    1,
                    goiDangBai.getGiaTien() != null ? goiDangBai.getGiaTien() : resolveInvoiceAmount(hoaDon),
                    resolveInvoiceAmount(hoaDon)
            ));
        }

        return List.of();
    }

    private List<InfoLine> receiverInfo(String title, NguoiDung user) {
        return List.of(
                new InfoLine(title, safe(user != null ? user.getHoVaTen() : "bạn")),
                new InfoLine("Email", safe(user != null ? user.getEmail() : "-")),
                new InfoLine("Số điện thoại", safe(user != null ? user.getSoDienThoai() : "-")),
                new InfoLine("Địa chỉ", safe(user != null ? user.getDiaChi() : "-"))
        );
    }

    private List<InfoLine> paymentInfo(HoaDon hoaDon) {
        return List.of(
                new InfoLine("Mã hóa đơn", safe(hoaDon != null ? hoaDon.getMaHoaDon() : "-")),
                new InfoLine("Loại hóa đơn", formatInvoiceType(hoaDon != null ? hoaDon.getLoaiHoaDon() : null)),
                new InfoLine("Ngày thanh toán", formatDateTime(hoaDon != null ? hoaDon.getNgayThanhToan() : null)),
                new InfoLine("Ký hiệu", "PDF-" + safe(hoaDon != null ? hoaDon.getMaHoaDon() : "HD"))
        );
    }

    private List<ChiTietHoaDon> normalizeDetails(List<ChiTietHoaDon> details) {
        return details == null ? List.of() : details;
    }

    private double resolveInvoiceAmount(HoaDon hoaDon) {
        return hoaDon != null && hoaDon.getSoTien() != null ? hoaDon.getSoTien() : 0D;
    }

    private double resolveAmount(ChiTietHoaDon item) {
        if (item == null) return 0D;
        if (item.getThanhTien() != null) return item.getThanhTien();

        int quantity = item.getSoLuong() != null && item.getSoLuong() > 0 ? item.getSoLuong() : 1;
        double unitPrice = item.getDonGia() != null ? item.getDonGia() : 0D;
        return unitPrice * quantity;
    }

    private FontSet loadFonts(PDDocument document) throws IOException {
        File regular = findExistingFile(REGULAR_FONT_PATHS);
        File bold = findExistingFile(BOLD_FONT_PATHS);

        if (regular == null) {
            throw new IOException("Không tìm thấy font Unicode để tạo PDF hóa đơn");
        }

        if (bold == null) {
            bold = regular;
        }

        return new FontSet(
                PDType0Font.load(document, regular),
                PDType0Font.load(document, bold)
        );
    }

    private File findExistingFile(String[] paths) {
        for (String path : paths) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                return file;
            }
        }
        return null;
    }

    private String formatInvoiceType(String loaiHoaDon) {
        if ("DANG_BAI".equalsIgnoreCase(loaiHoaDon)) return "Thanh toán gói đăng bài";
        if ("THUE_CAN_HO".equalsIgnoreCase(loaiHoaDon)) return "Thanh toán thuê căn hộ";
        return loaiHoaDon == null || loaiHoaDon.isBlank() ? "-" : loaiHoaDon;
    }

    private String formatCurrency(Double value) {
        if (value == null) return "0 đ";
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return formatter.format(value) + " đ";
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) return "-";
        return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private record FontSet(PDType0Font regular, PDType0Font bold) {
    }

    private record InfoLine(String label, String value) {
    }

    private record InvoiceLine(String code, String description, int quantity, double unitPrice, double amount) {
    }

    private enum Color {
        BLACK(0, 0, 0),
        TEXT(17, 24, 39),
        MUTED(107, 114, 128),
        BRAND(20, 83, 45),
        BRAND_DARK(6, 78, 59),
        LIGHT_BG(248, 250, 252),
        SOFT_BG(240, 253, 244),
        BORDER(209, 213, 219),
        LIGHT_BORDER(229, 231, 235),
        WHITE(255, 255, 255);

        private final int red;
        private final int green;
        private final int blue;

        Color(int red, int green, int blue) {
            this.red = red;
            this.green = green;
            this.blue = blue;
        }
    }

    private static class PdfCanvas {
        private final PDDocument document;
        private final FontSet fonts;
        private PDPage page;
        private PDPageContentStream content;
        private float y;

        private PdfCanvas(PDDocument document, FontSet fonts) throws IOException {
            this.document = document;
            this.fonts = fonts;
            addPage();
        }

        private void addPage() throws IOException {
            if (content != null) {
                content.close();
            }

            page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            content = new PDPageContentStream(document, page);
            y = PAGE_HEIGHT - MARGIN;
        }

        private void close() throws IOException {
            if (content != null) {
                content.close();
            }
        }

        private float getY() {
            return y;
        }

        private void moveY(float delta) {
            y += delta;
        }

        private void ensureSpace(float neededHeight) throws IOException {
            if (y - neededHeight < MARGIN) {
                addPage();
            }
        }

        private void drawHeader(String title, String subtitle, HoaDon hoaDon) throws IOException {
            ensureSpace(116F);
            setColor(Color.BRAND);
            content.addRect(MARGIN, y - 58F, CONTENT_WIDTH, 58F);
            content.fill();

            setColor(Color.WHITE);
            drawText(BRAND_NAME, MARGIN + 18F, y - 23F, 16F, true);
            drawText("Nền tảng kết nối người thuê và người cho thuê", MARGIN + 18F, y - 42F, 9.5F, false);

            drawRightText("Mã HĐ: " + safe(hoaDon != null ? hoaDon.getMaHoaDon() : "-"), PAGE_WIDTH - MARGIN - 18F, y - 23F, 10F, true);
            drawRightText("Ngày: " + formatDateTime(hoaDon != null ? hoaDon.getNgayThanhToan() : null), PAGE_WIDTH - MARGIN - 18F, y - 42F, 9.5F, false);
            y -= 86F;

            setColor(Color.TEXT);
            drawText(title, MARGIN, y, 20F, true);
            y -= 18F;
            setColor(Color.MUTED);
            drawText(subtitle, MARGIN, y, 10F, false);
            y -= 20F;
            drawHorizontalLine(MARGIN, PAGE_WIDTH - MARGIN, y, 0.8F, Color.LIGHT_BORDER);
            y -= 22F;
        }

        private void drawSectionTitle(String title) throws IOException {
            ensureSpace(34F);
            setColor(Color.BRAND_DARK);
            drawText(title, MARGIN, y, 11F, true);
            y -= 14F;
        }

        private void drawTwoColumnInfo(List<InfoLine> left, List<InfoLine> right) throws IOException {
            float gap = 18F;
            float boxWidth = (CONTENT_WIDTH - gap) / 2F;
            float rowHeight = 18F;
            int rows = Math.max(left.size(), right.size());
            float boxHeight = rows * rowHeight + 20F;
            ensureSpace(boxHeight + 18F);

            drawInfoBox(MARGIN, y, boxWidth, boxHeight, left, rowHeight);
            drawInfoBox(MARGIN + boxWidth + gap, y, boxWidth, boxHeight, right, rowHeight);
            y -= boxHeight + 22F;
        }

        private void drawInfoBox(float x, float topY, float width, float height, List<InfoLine> lines, float rowHeight) throws IOException {
            fillRect(x, topY - height, width, height, Color.LIGHT_BG);
            strokeRect(x, topY - height, width, height, Color.LIGHT_BORDER, 0.7F);
            float currentY = topY - 14F;

            for (InfoLine line : lines) {
                setColor(Color.MUTED);
                drawText(line.label(), x + 12F, currentY, 8.5F, false);
                setColor(Color.TEXT);
                List<String> wrapped = wrapText(line.value(), width - 98F, 9.5F, true);
                drawText(wrapped.isEmpty() ? "-" : wrapped.get(0), x + 92F, currentY, 9.5F, true);
                currentY -= rowHeight;
            }
        }

        private void drawTableHeader(float[] widths, String[] headers) throws IOException {
            float height = 24F;
            ensureSpace(height + 18F);
            float x = MARGIN;
            fillRect(MARGIN, y - height, CONTENT_WIDTH, height, Color.BRAND);

            for (int i = 0; i < headers.length; i++) {
                setColor(Color.WHITE);
                drawText(headers[i], x + 6F, y - 15.5F, 8.8F, true);
                x += widths[i];
            }
            y -= height;
        }

        private void drawTableRow(float[] widths, List<String> cells, List<Boolean> rightAlign, boolean shaded) throws IOException {
            float rowHeight = calculateRowHeight(widths, cells);
            ensureSpace(rowHeight + 26F);

            if (shaded) {
                fillRect(MARGIN, y - rowHeight, CONTENT_WIDTH, rowHeight, Color.LIGHT_BG);
            }

            float x = MARGIN;
            for (int i = 0; i < cells.size(); i++) {
                strokeRect(x, y - rowHeight, widths[i], rowHeight, Color.LIGHT_BORDER, 0.5F);
                List<String> wrapped = wrapText(cells.get(i), widths[i] - 12F, 8.8F, false);
                float textY = y - 13F;

                for (String line : wrapped) {
                    setColor(Color.TEXT);
                    if (rightAlign.get(i)) {
                        drawRightText(line, x + widths[i] - 6F, textY, 8.8F, false);
                    } else {
                        drawText(line, x + 6F, textY, 8.8F, false);
                    }
                    textY -= 11F;
                }
                x += widths[i];
            }
            y -= rowHeight;
        }

        private float calculateRowHeight(float[] widths, List<String> cells) throws IOException {
            float maxLines = 1F;
            for (int i = 0; i < cells.size(); i++) {
                maxLines = Math.max(maxLines, wrapText(cells.get(i), widths[i] - 12F, 8.8F, false).size());
            }
            return Math.max(28F, 16F + maxLines * 11F);
        }

        private void drawAmountLine(String label, double amount, float labelX, float valueX, boolean strong) throws IOException {
            ensureSpace(24F);
            setColor(strong ? Color.BRAND_DARK : Color.TEXT);
            drawText(label, labelX, y, strong ? 11F : 10F, strong);
            drawRightText(formatCurrency(amount), valueX, y, strong ? 11.5F : 10F, strong);
            y -= strong ? 18F : 16F;
        }

        private void drawPaidStamp(float x, float topY) throws IOException {
            float width = 132F;
            float height = 42F;
            strokeRect(x, topY - height, width, height, Color.BRAND, 1.2F);
            setColor(Color.BRAND);
            drawCenteredText("ĐÃ THANH TOÁN", x + width / 2F, topY - 17F, 12F, true);
            drawCenteredText(BRAND_NAME, x + width / 2F, topY - 31F, 8.5F, false);
        }

        private void drawHorizontalLine(float fromX, float toX, float lineY, float width, Color color) throws IOException {
            setColor(color);
            content.setLineWidth(width);
            content.moveTo(fromX, lineY);
            content.lineTo(toX, lineY);
            content.stroke();
        }

        private void drawText(String text, float x, float textY, float fontSize, boolean bold) throws IOException {
            content.beginText();
            content.setFont(bold ? fonts.bold() : fonts.regular(), fontSize);
            content.newLineAtOffset(x, textY);
            content.showText(safe(text));
            content.endText();
        }

        private void drawRightText(String text, float rightX, float textY, float fontSize, boolean bold) throws IOException {
            float textWidth = textWidth(text, fontSize, bold);
            drawText(text, rightX - textWidth, textY, fontSize, bold);
        }

        private void drawCenteredText(String text, float centerX, float textY, float fontSize, boolean bold) throws IOException {
            float textWidth = textWidth(text, fontSize, bold);
            drawText(text, centerX - textWidth / 2F, textY, fontSize, bold);
        }

        private float textWidth(String text, float fontSize, boolean bold) throws IOException {
            return (bold ? fonts.bold() : fonts.regular()).getStringWidth(safe(text)) / 1000F * fontSize;
        }

        private List<String> wrapText(String text, float maxWidth, float fontSize, boolean bold) throws IOException {
            String safeText = safe(text);
            String[] words = safeText.split("\\s+");
            List<String> lines = new ArrayList<>();
            StringBuilder current = new StringBuilder();

            for (String word : words) {
                String candidate = current.isEmpty() ? word : current + " " + word;
                if (textWidth(candidate, fontSize, bold) <= maxWidth) {
                    current.setLength(0);
                    current.append(candidate);
                    continue;
                }

                if (!current.isEmpty()) {
                    lines.add(current.toString());
                    current.setLength(0);
                }

                if (textWidth(word, fontSize, bold) <= maxWidth) {
                    current.append(word);
                } else {
                    lines.addAll(splitLongWord(word, maxWidth, fontSize, bold));
                }
            }

            if (!current.isEmpty()) {
                lines.add(current.toString());
            }
            return lines.isEmpty() ? List.of("-") : lines;
        }

        private List<String> splitLongWord(String word, float maxWidth, float fontSize, boolean bold) throws IOException {
            List<String> parts = new ArrayList<>();
            StringBuilder current = new StringBuilder();

            for (char c : word.toCharArray()) {
                String candidate = current.toString() + c;
                if (textWidth(candidate, fontSize, bold) <= maxWidth) {
                    current.append(c);
                } else {
                    if (!current.isEmpty()) {
                        parts.add(current.toString());
                    }
                    current.setLength(0);
                    current.append(c);
                }
            }

            if (!current.isEmpty()) {
                parts.add(current.toString());
            }
            return parts;
        }

        private void fillRect(float x, float y, float width, float height, Color color) throws IOException {
            setColor(color);
            content.addRect(x, y, width, height);
            content.fill();
        }

        private void strokeRect(float x, float y, float width, float height, Color color, float lineWidth) throws IOException {
            setColor(color);
            content.setLineWidth(lineWidth);
            content.addRect(x, y, width, height);
            content.stroke();
        }

        private void setColor(Color color) throws IOException {

            float r = color.red / 255f;
            float g = color.green / 255f;
            float b = color.blue / 255f;

            content.setNonStrokingColor(r, g, b);
            content.setStrokingColor(r, g, b);
        }

        private String formatCurrency(Double value) {
            if (value == null) return "0 đ";
            NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
            return formatter.format(value) + " đ";
        }

        private String formatDateTime(LocalDateTime value) {
            if (value == null) return "-";
            return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }

        private String safe(String value) {
            return value == null || value.isBlank() ? "-" : value;
        }
    }
}
