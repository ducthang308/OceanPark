import React, { useEffect, useRef, useState } from "react";
import "./listing.css";
import { Button, Checkbox, Col, Input, message, Row, Select } from "antd";
import { ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ThunderboltOutlined,
  RobotOutlined,
} from "@ant-design/icons";

import Image from "../../../../assets/img/co4la.png";
import VideoIcon from "../../../../assets/img/upload-video.png";
import Navbar from "../../../../components/layout/Navbar/navbar";
import { DANANG_ADMINISTRATIVE_UNITS } from "../../../../constants/danangAdministrativeUnits";
import { generatePostContentByAI } from "../../../../services/api/PostManagementService";

import { useNavigate } from "react-router-dom";
import {
  createApartmentDetail,
  createPost,
  getCategories,
  uploadPostImages,
  uploadPostVideo,
  type DanhMucDTO,
} from "../../../../services/api/PostManagementService";

import { Drawer, Alert, Spin } from "antd";
import { analyzeRentPrice } from "../../../../services/api/PostManagementService";
import type { RentPriceAnalysisResponse } from "../../../../services/api/PostManagementService";

interface UploadedImage {
  id: string;
  file: File;
  url: string;
}

interface UploadedVideo {
  file: File;
  url: string;
}

interface StoredUser {
  maNguoiDung?: string;
  hoVaTen?: string;
  soDienThoai?: string;
  email?: string;
  vaiTro?: string;
}

const { Option } = Select;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const messageValue = (data as { message?: unknown }).message;
      if (typeof messageValue === "string" && messageValue.trim()) return messageValue;
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
};

const getStoredUser = (): StoredUser | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

const PENDING_POST_IDS_KEY_PREFIX = "pendingPostIds:";

const saveLocalPendingPostId = (maNguoiDung: string, maBaiDang: string) => {
  const key = `${PENDING_POST_IDS_KEY_PREFIX}${maNguoiDung}`;

  try {
    const currentValue = localStorage.getItem(key);
    const currentIds = currentValue ? JSON.parse(currentValue) : [];
    const ids = Array.isArray(currentIds) ? currentIds.filter((id) => typeof id === "string") : [];

    if (!ids.includes(maBaiDang)) {
      localStorage.setItem(key, JSON.stringify([...ids, maBaiDang]));
    }
  } catch {
    localStorage.setItem(key, JSON.stringify([maBaiDang]));
  }
};

const Listing = () => {
  const storedUser = getStoredUser();
  const navigate = useNavigate();
  const [priceAnalysisOpen, setPriceAnalysisOpen] = useState(false);
  const [priceAnalysisLoading, setPriceAnalysisLoading] = useState(false);
  const [priceAnalysis, setPriceAnalysis] = useState<RentPriceAnalysisResponse | null>(null);

  const [categories, setCategories] = useState<DanhMucDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    maDanhMuc: "",
    tieuDe: "",
    noiDung: "",
    hinhThucThanhToan: "",
    gia: "",
    dienTich: "",
    phongNgu: "",
    huongCanHo: "",
  });

  const [address, setAddress] = useState({
    thanhPho: "",
    phuong: "",
    diaChi: "",
    diaChiCuThe: "",
  });
  const { thanhPho, phuong, diaChi } = address;

  const fullAddress =
    address.diaChiCuThe ||
    [address.diaChi, address.phuong, address.thanhPho].filter(Boolean).join(", ");

  const [position, setPosition] = useState<[number, number]>([
    16.047079, 108.20623,
  ]);
  const [isLocatingByAddress, setIsLocatingByAddress] = useState(false);

  const markerRef = useRef<L.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => message.error("Không tải được danh mục"));
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const danangLatLng: [number, number] = [16.047079, 108.20623];

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(danangLatLng, 13);

    mapInstanceRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: "custom-map-marker",
      html: `<div class="custom-map-marker__pin"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const marker = L.marker(danangLatLng, {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    setPosition(danangLatLng);

    marker.bindPopup("Vị trí bài đăng").openPopup();

    setTimeout(() => {
      map.invalidateSize();
    }, 0);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(mapRef.current);

    marker.on("dragend", () => {
      const latLng = marker.getLatLng();
      setPosition([latLng.lat, latLng.lng]);
      marker
        .bindPopup(
          `Vĩ độ: ${latLng.lat.toFixed(6)}<br/>Kinh độ: ${latLng.lng.toFixed(6)}`
        )
        .openPopup();
    });

    map.on("click", (event) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      setPosition([lat, lng]);
      marker
        .bindPopup(`Vĩ độ: ${lat.toFixed(6)}<br/>Kinh độ: ${lng.toFixed(6)}`)
        .openPopup();
    });

    return () => {
      resizeObserver.disconnect();
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };

  }, []);

  useEffect(() => {
    if (thanhPho && phuong && diaChi) {
      setAddress((prev) => ({
        ...prev,
        diaChiCuThe: `${diaChi}, ${phuong}, ${thanhPho}`,
      }));
    }
  }, [thanhPho, phuong, diaChi]);

  const handleSelectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (images.length + files.length > 20) {
      message.error("Bạn chỉ được tải tối đa 20 ảnh");
      return;
    }

    const invalidFile = files.find((file) => file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      message.error("Dung lượng mỗi ảnh tối đa 10MB");
      return;
    }

    const fileURLs: UploadedImage[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2, 11),
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...fileURLs]);
    setIsUploading(false);
  };

  const handleSelectVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      message.error("Dung lượng video tối đa 50MB");
      return;
    }

    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }

    setVideo({
      file,
      url: URL.createObjectURL(file),
    });
    setIsUploadingVideo(false);
  };

  const handleRemoveVideo = () => {
    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }

    setVideo(null);

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleLocateByAddress = async () => {
    if (!fullAddress) {
      message.warning("Vui lòng nhập địa chỉ trước");
      return;
    }

    try {
      setIsLocatingByAddress(true);

      const query = encodeURIComponent(fullAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Không tìm thấy địa chỉ");
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        message.warning("Không tìm thấy vị trí từ địa chỉ này");
        return;
      }

      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        message.error("Dữ liệu tọa độ không hợp lệ");
        return;
      }

      const nextPosition: [number, number] = [lat, lon];
      setPosition(nextPosition);

      mapInstanceRef.current?.flyTo(nextPosition, 16, {
        duration: 1.5,
      });

      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);

      markerRef.current
        ?.setLatLng(nextPosition)
        .bindPopup(`Đã định vị theo địa chỉ:<br/>${fullAddress}`)
        .openPopup();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi khi định vị địa chỉ");
    } finally {
      setIsLocatingByAddress(false);
    }
  };

  const handleGenerateAIContent = async () => {
    console.log("CLICK AI BUTTON");

    try {
      setAiLoading(true);

      const selectedCategory = categories.find(
        (item) => item.maDanhMuc === formData.maDanhMuc
      );

      const payload = {
        loaiCanHo: selectedCategory?.tenDanhMuc || undefined,
        gia: formData.gia ? Number(formData.gia) : undefined,
        dienTich: formData.dienTich ? Number(formData.dienTich) : undefined,
        diaChi: address.diaChiCuThe || address.diaChi || undefined,
        phuong: address.phuong || undefined,
        phongNgu: formData.phongNgu ? Number(formData.phongNgu) : undefined,
        lienHe: storedUser?.soDienThoai || undefined,
        tieuDeHienTai: formData.tieuDe || undefined,
        noiDungHienTai: formData.noiDung || undefined,
      };

      console.log("AI PAYLOAD =", payload);

      const res = await generatePostContentByAI(payload);

      console.log("AI RESPONSE =", res);

      setFormData((prev) => ({
        ...prev,
        tieuDe: res.tieuDe || prev.tieuDe,
        noiDung: res.noiDung || prev.noiDung,
      }));

      message.success("AI đã gợi ý nội dung thành công");
    } catch (error: any) {
      console.error("AI ERROR =", error);
      console.error("AI ERROR RESPONSE =", error?.response?.data);

      message.error(
        error?.response?.data?.message ||
        "Không thể tạo nội dung bằng AI"
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeRentPrice = async () => {
    const gia = Number(formData.gia);
    const dienTich = Number(formData.dienTich);
    const phongNgu = Number(formData.phongNgu);

    if (!formData.gia || !formData.dienTich || !formData.phongNgu || !address.phuong) {
      message.warning("Vui lòng nhập giá, diện tích, phòng ngủ và phường trước khi phân tích");
      return;
    }

    try {
      setPriceAnalysisOpen(true);
      setPriceAnalysisLoading(true);

      const selectedCategory = categories.find(
        (item) => item.maDanhMuc === formData.maDanhMuc
      );

      const result = await analyzeRentPrice({
        loaiCanHo: selectedCategory?.tenDanhMuc || "Căn hộ",
        giaDeXuat: gia,
        dienTich,
        phuong: address.phuong,
        diaChi: fullAddress,
        phongNgu,
        coBanCong: false,
        dayDuNoiThat: false,
        ganTrungTam: false,
        ganBien: false,
      });

      setPriceAnalysis(result);
    } catch (error) {
      console.error(error);
      message.error("Không thể phân tích giá thuê");
    } finally {
      setPriceAnalysisLoading(false);
    }
  };

  const handleSubmit = async () => {
    const maNguoiDung = localStorage.getItem("userId") || storedUser?.maNguoiDung;
    const phone = storedUser?.soDienThoai || "";

    if (isSubmitting) return;

    if (!maNguoiDung) {
      message.error("Vui lòng đăng nhập trước khi đăng tin");
      return;
    }

    if (!formData.maDanhMuc || !formData.tieuDe || !formData.noiDung) {
      message.error("Vui lòng nhập đầy đủ loại chuyên mục, tiêu đề và nội dung");
      return;
    }

    if (
      !formData.hinhThucThanhToan ||
      !formData.gia ||
      !formData.dienTich ||
      !formData.phongNgu ||
      !formData.huongCanHo ||
      !address.phuong ||
      !fullAddress
    ) {
      message.error("Vui lòng nhập đầy đủ thông tin căn hộ");
      return;
    }

    const gia = Number(formData.gia);
    const dienTich = Number(formData.dienTich);
    const phongNgu = Number(formData.phongNgu);

    if (Number.isNaN(gia) || Number.isNaN(dienTich) || Number.isNaN(phongNgu)) {
      message.error("Giá, diện tích và phòng ngủ phải là số hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);

      const post = await createPost({
        maNguoiDung,
        maDanhMuc: formData.maDanhMuc,
        tieuDe: formData.tieuDe,
        noiDung: formData.noiDung,
        trangThai: "PENDING",
        lienHe: phone,
        hinhThucThanhToan: formData.hinhThucThanhToan,
      });

      if (!post.maBaiDang) {
        throw new Error("Backend không trả về mã bài đăng");
      }

      await createApartmentDetail({
        maBaiDang: post.maBaiDang,
        gia,
        dienTich,
        phongNgu,
        diaChiCuThe: fullAddress,
        huongCanHo: formData.huongCanHo,
        phuong: address.phuong,
        lat: position[0],
        lng: position[1],
      });

      if (images.length > 0) {
        await uploadPostImages(
          post.maBaiDang,
          images.map((imageItem) => imageItem.file)
        );
      }

      if (video) {
        setIsUploadingVideo(true);
        await uploadPostVideo(post.maBaiDang, video.file);
      }

      saveLocalPendingPostId(maNguoiDung, post.maBaiDang);
      message.success("Đăng tin thành công");

      setFormData({
        maDanhMuc: "",
        tieuDe: "",
        noiDung: "",
        hinhThucThanhToan: "",
        gia: "",
        dienTich: "",
        phongNgu: "",
        huongCanHo: "",
      });
      setImages([]);
      if (video?.url) {
        URL.revokeObjectURL(video.url);
      }
      setVideo(null);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      navigate("/list-post");
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(error, "Đăng tin thất bại"));
    } finally {
      setIsSubmitting(false);
      setIsUploadingVideo(false);
    }
  };

  return (
    <div className="listing-layout">
      <Navbar />
      <div className="listing-content-area">
        <div className="container-listing">
          <div className="listing-main-header">
            <div className="listing-header-top">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                className="listing-back-btn"
              >
                Quay lại
              </Button>
            </div>
            <h1 className="listing-main-title">Đăng tin mới</h1>
            <p className="listing-main-subtitle">Vui lòng điền thông tin chính xác để tin đăng đạt hiệu quả tốt nhất</p>
          </div>

          <div className="category-listing">
            <div className="title-listing">Loại chuyên mục</div>
            <div className="form-group-listing">
              <label className="label" htmlFor="category">
                Loại chuyên mục <span className="required">(*)</span>
              </label>
              <Select
                className="select-listing"
                placeholder="-- Chọn loại chuyên mục --"

                size="large"
                allowClear
                value={formData.maDanhMuc || undefined}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, maDanhMuc: value || "" }))
                }
              >
                {categories.map((item) => (
                  <Option key={item.maDanhMuc} value={item.maDanhMuc}>
                    {item.tenDanhMuc}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="area-listing">
            <div className="title-listing">Khu vực</div>

            <div className="area-select">
              <div className="area-left">
                <div className="form-group-listing">
                  <label className="label">
                    Thành phố <span className="required">(*)</span>
                  </label>
                  <Select
                    className="select-listing"
                    placeholder="-- Chọn tỉnh/thành phố --"
                    size="large"
                    value={address.thanhPho || undefined}
                    onChange={(value) =>
                      setAddress((prev) => ({ ...prev, thanhPho: value }))
                    }
                  >
                    <Option value="Đà Nẵng">Đà Nẵng</Option>
                  </Select>
                </div>

                <div className="form-group-listing">
                  <label className="label">Phường/Xã</label>
                  <Select
                    className="select-listing"
                    placeholder="-- Chọn phường/xã --"
                    size="large"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    value={address.phuong || undefined}
                    onChange={(value) =>
                      setAddress((prev) => ({ ...prev, phuong: value || "" }))
                    }
                  >
                    {DANANG_ADMINISTRATIVE_UNITS.map((unit) => (
                      <Option key={unit} value={unit}>
                        {unit}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="area-right">
                <div className="form-group-listing">
                  <label className="label">Địa chỉ</label>
                  <Input
                    className="input-height"
                    placeholder="Nhập địa chỉ"
                    value={address.diaChi}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, diaChi: event.target.value }))
                    }
                  />
                </div>

                <div className="form-group-listing">
                  <label className="label">Địa chỉ cụ thể</label>
                  <Input
                    className="input-height"
                    value={address.diaChiCuThe}
                    readOnly
                    style={{ backgroundColor: "#f5f5f5" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="map-listing">
            <div className="map-listing__header">
              <div>
                <div className="title-listing">Bản đồ</div>
                <p className="map-listing__subtitle">
                  Click trên bản đồ hoặc kéo ghim để chọn vị trí chính xác
                </p>
              </div>

              <button
                type="button"
                className="map-listing__locate-btn"
                onClick={handleLocateByAddress}
                disabled={isLocatingByAddress}
              >
                {isLocatingByAddress ? "Đang định vị..." : "Định vị theo địa chỉ"}
              </button>
            </div>

            <div className="map-listing__address-preview">
              <span>Địa chỉ hiện tại:</span>
              <strong>{fullAddress || "Chưa có địa chỉ"}</strong>
            </div>

            <div ref={mapRef} id="map" className="map-listing__map" />

            <div className="map-listing__footer">
              <div className="map-listing__coords">
                <span>Latitude:</span>
                <strong>{position[0].toFixed(6)}</strong>
              </div>

              <div className="map-listing__coords">
                <span>Longitude:</span>
                <strong>{position[1].toFixed(6)}</strong>
              </div>
            </div>
          </div>

          <div className="detail-listing">
            <div className="title-listing">
              Thông tin mô tả
            </div>

            <div className="form-group-listing">

              {/* AI CONTENT BOX */}
              <div className="ai-content-box">

                <div className="ai-content-left">
                  <div className="ai-content-icon">
                    <ThunderboltOutlined />
                  </div>

                  <div className="ai-content-text">
                    <h3>Sử dụng AI để viết</h3>

                    <p>
                      AI sẽ tự động gợi ý tiêu đề và mô tả bài đăng
                      dựa trên giá, diện tích, vị trí và loại căn hộ.
                    </p>
                  </div>
                </div>

                <Button
                  htmlType="button"
                  type="primary"
                  className="ai-generate-btn"
                  loading={aiLoading}
                  icon={<RobotOutlined />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateAIContent();
                  }}
                >
                  {aiLoading ? "AI đang tạo nội dung..." : "Sử dụng AI để viết"}
                </Button>
              </div>

              {/* TITLE */}
              <label className="label">
                Tiêu đề <span className="required">(*)</span>
              </label>

              <TextArea
                rows={2}
                placeholder="Ví dụ: Căn hộ mini full nội thất gần biển Mỹ Khê..."
                value={formData.tieuDe}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    tieuDe: event.target.value,
                  }))
                }
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group-listing gap">
              <label className="label">
                Nội dung mô tả <span className="required">(*)</span>
              </label>

              <TextArea
                rows={10}
                placeholder="Mô tả chi tiết căn hộ, tiện ích, vị trí..."
                value={formData.noiDung}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    noiDung: event.target.value,
                  }))
                }
              />

              <div className="ai-helper-text">
                AI có thể hỗ trợ viết nội dung hấp dẫn và chuyên nghiệp hơn.
              </div>
            </div>

            <div className="detail-listing-grid">
              <div className="form-group-listing gap">
                <label className="label">
                  Hình thức thanh toán <span className="required">(*)</span>
                </label>
                <Select
                  className="select-listing"
                  placeholder="-- Chọn hình thức thanh toán --"
                  size="large"
                  value={formData.hinhThucThanhToan || undefined}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, hinhThucThanhToan: value }))
                  }
                >
                  <Option value="Cash">Tiền mặt</Option>
                  <Option value="Transfer">Chuyển khoản</Option>
                </Select>
              </div>

              <div className="form-group-listing gap">
                <label className="label">
                  Giá cho thuê <span className="required">(*)</span>
                </label>
                <Input
                  className="input-height"
                  placeholder="Nhập giá thuê"
                  value={formData.gia}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, gia: event.target.value }))
                  }
                />
                <span className="listing-span">
                  Nhập đầy đủ số, ví dụ 1 triệu thì nhập là 1000000
                </span>
              </div>

              <div className="form-group-listing gap">
                <label className="label">
                  Diện tích <span className="required">(*)</span>
                </label>
                <Input
                  className="input-height"
                  placeholder="Nhập diện tích"
                  value={formData.dienTich}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, dienTich: event.target.value }))
                  }
                />
                <span className="listing-span">
                  Đơn vị tính: m<sup>2</sup>
                </span>
              </div>

              <div className="form-group-listing gap">
                <label className="label">
                  Phòng ngủ <span className="required">(*)</span>
                </label>
                <Select
                  className="select-listing"
                  placeholder="-- Chọn phòng ngủ --"
                  size="large"
                  value={formData.phongNgu || undefined}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, phongNgu: value }))
                  }
                >
                  <Option value="1">1 phòng ngủ</Option>
                  <Option value="2">2 phòng ngủ</Option>
                  <Option value="3">3 phòng ngủ</Option>
                </Select>
              </div>

              <div className="form-group-listing gap">
                <label className="label">
                  Hướng căn hộ <span className="required">(*)</span>
                </label>
                <Select
                  className="select-listing"
                  placeholder="-- Chọn hướng căn hộ --"
                  size="large"
                  value={formData.huongCanHo || undefined}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, huongCanHo: value }))
                  }
                >
                  <Option value="Đông">Đông</Option>
                  <Option value="Tây">Tây</Option>
                  <Option value="Nam">Nam</Option>
                  <Option value="Bắc">Bắc</Option>
                  <Option value="Đông Bắc">Đông Bắc</Option>
                  <Option value="Đông Nam">Đông Nam</Option>
                  <Option value="Tây Bắc">Tây Bắc</Option>
                  <Option value="Tây Nam">Tây Nam</Option>
                </Select>
              </div>
            </div>
          </div>

          <div className="features-listing">
            <div className="title-listing">Điểm nổi bật</div>
            <Checkbox.Group style={{ width: "100%" }}>
              <Row>
                <Col span={8}>
                  <Checkbox value="noi-that">Đầy đủ nội thất</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="may-lanh">Có máy lạnh</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="thang-may">Có thang máy</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="bao-ve">Có bảo vệ 24/24</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="may-giat">Có máy giặt</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="khong-chung-chu">Không chung chủ</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="ham-xe">Có hầm để xe</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="ke-bep">Có kệ bếp</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="tu-lanh">Có tủ lạnh</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="gio-tu-do">Giờ giấc tự do</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value="ban-cong">Có ban công</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </div>

          <div className="img-listing">
            <div className="title-listing">Hình ảnh</div>

            <div className="browse_photos" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-image">
                <img className="icon-upload-image" src={Image} alt="upload icon" />
                <span className="upload-text">
                  {isUploading ? "Đang đăng hình..." : "Tải ảnh từ thiết bị"}
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectImages}
                multiple
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            <div className="note-span">
              <span className="listing-span">• Tải lên tối đa 20 ảnh trong một bài đăng</span>
              <span className="listing-span">• Dung lượng ảnh tối đa 10MB</span>
              <span className="listing-span">
                • Hình ảnh phải liên quan đến phòng trọ, nhà cho thuê
              </span>
              <span className="listing-span">
                • Không chèn văn bản, số điện thoại lên ảnh
              </span>
            </div>

            <div className="image-grid">
              {images.map((img) => (
                <div key={img.id} className="image-card">
                  <img src={img.url} alt="preview" />
                  <button
                    type="button"
                    onClick={() => handleRemove(img.id)}
                    className="delete-btn"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="video-listing">
            <div className="title-listing">Video</div>

            <div className="browse_photos" onClick={() => videoInputRef.current?.click()}>
              <div className="upload-image">
                <img className="icon-upload-image" src={VideoIcon} alt="upload video icon" />
                <span className="upload-text">
                  {isUploadingVideo
                    ? "Đang đăng video..."
                    : video
                      ? "Thay đổi video"
                      : "Tải video từ thiết bị"}
                </span>
              </div>

              <input
                type="file"
                ref={videoInputRef}
                onChange={handleSelectVideo}
                accept="video/*"
                style={{ display: "none" }}
              />
            </div>

            <div className="note-span">
              <span className="listing-span">• Tải lên tối đa 1 video trong một bài đăng</span>
              <span className="listing-span">• Video sẽ hiển thị trong trang chi tiết bài đăng</span>
              <span className="listing-span">• Dung lượng video tối đa 50MB</span>
            </div>

            {video && (
              <div className="video-preview">
                <video controls width="100%" src={video.url} />
                <button type="button" onClick={handleRemoveVideo} className="delete-btn">
                  Xóa video
                </button>
              </div>
            )}
          </div>

          <div className="contact-listing">
            <div className="title-listing">Thông tin liên hệ</div>
            <div className="contact-flex">
              <div className="form-group-listing">
                <label className="label">Họ Tên</label>
                <Input
                  className="input-height"
                  value={storedUser?.hoVaTen || localStorage.getItem("hoVaTen") || ""}
                  readOnly
                />
              </div>
              <div className="form-group-listing">
                <label className="label">Số điện thoại</label>
                <Input className="input-height" value={storedUser?.soDienThoai || ""} readOnly />
              </div>
            </div>
          </div>

          <div className="button-listing">
            <Button
              type="default"
              className="ai-price-analysis-btn"
              block
              icon={<ThunderboltOutlined />}
              onClick={handleAnalyzeRentPrice}
              disabled={isSubmitting}
            >
              AI phân tích giá thuê
            </Button>

            <Button
              type="primary"
              className="continue-btn"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              block
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Đang đăng tin..." : "Đăng tin"}
            </Button>
          </div>
          <Drawer
            title="AI phân tích giá thuê"
            placement="right"
            width={420}
            open={priceAnalysisOpen}
            onClose={() => setPriceAnalysisOpen(false)}
          >
            {priceAnalysisLoading ? (
              <div className="price-analysis-loading">
                <Spin />
                <p>AI đang phân tích giá thuê...</p>
              </div>
            ) : priceAnalysis ? (
              <div className="price-analysis-result">
                <Alert
                  type={
                    priceAnalysis.mucDoHopLy === "HOP_LY"
                      ? "success"
                      : priceAnalysis.mucDoHopLy === "CAO_HON_THI_TRUONG"
                        ? "warning"
                        : "info"
                  }
                  message={
                    priceAnalysis.mucDoHopLy === "HOP_LY"
                      ? "Giá thuê hợp lý"
                      : priceAnalysis.mucDoHopLy === "CAO_HON_THI_TRUONG"
                        ? "Giá đang cao hơn thị trường"
                        : "Giá đang thấp hơn thị trường"
                  }
                  showIcon
                />

                <div className="price-analysis-card">
                  <span>Khoảng giá tham khảo</span>
                  <strong>
                    {priceAnalysis.giaThap.toLocaleString("vi-VN")}đ -{" "}
                    {priceAnalysis.giaCao.toLocaleString("vi-VN")}đ/tháng
                  </strong>
                </div>

                <div className="price-analysis-card highlight">
                  <span>Giá khuyến nghị</span>
                  <strong>
                    {priceAnalysis.giaKhuyenNghi.toLocaleString("vi-VN")}đ/tháng
                  </strong>
                </div>

                <div className="price-analysis-section">
                  <h4>Nhận xét</h4>
                  <p>{priceAnalysis.nhanXet}</p>
                </div>

                <div className="price-analysis-section">
                  <h4>Chiến lược cho thuê</h4>
                  <p>{priceAnalysis.chienLuoc}</p>
                </div>

                <Button
                  type="primary"
                  block
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      gia: String(priceAnalysis.giaKhuyenNghi),
                    }))
                  }
                >
                  Áp dụng giá khuyến nghị
                </Button>
              </div>
            ) : (
              <p>Nhập thông tin căn hộ rồi bấm phân tích để AI đánh giá giá thuê.</p>
            )}
          </Drawer>
        </div>
      </div>
    </div>
  );
};

export default Listing;
