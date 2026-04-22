import React, { useEffect, useRef, useState } from 'react';
import "./listing.css";
import { Select, Input } from 'antd';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TextArea from 'antd/es/input/TextArea';
import { Checkbox, Col, Row } from 'antd';
// import Image from "../../../assets/img/upload-image.png"
// import Video from "../../../assets/img/upload-video.png"
import Image from "../../../../assets/img/co4la.png"
import Video from "../../../../assets/img/co4la.png"
import { Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

interface UploadedImage {
    id: string;
    file: File;
    url: string;
}

const { Option } = Select;

const Listing = () => {
    const [address, setAddress] = useState({
        thanhPho: '',
        phuong: '',
        diaChi: '',
        diaChiCuThe: ''
    });

    const fullAddress = [
        address.diaChiCuThe,
        address.diaChi,
        address.phuong,
        address.thanhPho,
    ]
    .filter(Boolean)
    .join(', ');

    const [position, setPosition] = useState<[number, number]>([16.047079, 108.20623]);
    const [isLocatingByAddress, setIsLocatingByAddress] = useState(false);
    const markerRef = useRef<L.Marker | null>(null);

    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const [video, setVideo] = useState<{ file: File; url: string } | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);

    const handleSelectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Giới hạn dung lượng nếu cần
        if (file.size > 50 * 1024 * 1024) { // 50MB
            alert("Video quá lớn. Vui lòng chọn video dưới 50MB.");
            return;
        }

        const url = URL.createObjectURL(file);
        setVideo({ file, url });
        setIsUploadingVideo(false);
    };

    const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const fileURLs: UploadedImage[] = files.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            url: URL.createObjectURL(file),
        }));

        // ✅ Giới hạn 20 ảnh
        if (images.length + fileURLs.length > 20) {
            alert("Bạn chỉ được tải tối đa 20 ảnh!");
            return;
        }

        setImages((prev) => [...prev, ...fileURLs]);
        setIsUploading(false);
    };

    const handleRemove = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };


    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const danangLatLng: [number, number] = [16.047079, 108.206230];

        const map = L.map(mapRef.current, {
            zoomControl: false,
        }).setView(danangLatLng, 13);

        mapInstanceRef.current = map;

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20,
        }).addTo(map);

        const customIcon = L.divIcon({
            className: 'custom-map-marker',
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

        marker.bindPopup('Vị trí bài đăng').openPopup();

        marker.on('dragend', () => {
            const latLng = marker.getLatLng();
            setPosition([latLng.lat, latLng.lng]);
            marker
                .bindPopup(
                    `Vĩ độ: ${latLng.lat.toFixed(6)}<br/>Kinh độ: ${latLng.lng.toFixed(6)}`
                )
                .openPopup();
            console.log('Tọa độ được kéo tới:', latLng.lat, latLng.lng);
        });

        map.on('click', function (e) {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setPosition([lat, lng]);
            marker
                .bindPopup(`Vĩ độ: ${lat.toFixed(6)}<br/>Kinh độ: ${lng.toFixed(6)}`)
                .openPopup();
            console.log('Tọa độ được chọn:', lat, lng);
        });

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, []);

    const handleLocateByAddress = async () => {
        if (!fullAddress) {
            alert('Vui lòng nhập địa chỉ trước.');
            return;
        }

        try {
            setIsLocatingByAddress(true);

            const query = encodeURIComponent(fullAddress);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1}`
            );

            if (!response.ok) {
                throw new Error('Không tìm thấy địa chỉ');
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                alert('Không tìm thấy vị trí từ địa chỉ này.');
                return;
            }

            const lat = Number(data[0].lat);
            const lon = Number(data[0].lon);

            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                alert('Dữ liệu tọa độ không hợp lệ.');
                return;
            }

            const nextPosition: [number, number] = [lat, lon];
            setPosition(nextPosition);

            if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(nextPosition, 16, {
                    duration: 1.5,
                });
            }

            if (markerRef.current) {
                markerRef.current
                    .setLatLng(nextPosition)
                    .bindPopup(`Đã định vị theo địa chỉ:<br/>${fullAddress}`)
                    .openPopup();
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi khi định vị địa chỉ.');
        } finally {
            setIsLocatingByAddress(false);
        }
    };

    useEffect(() => {
        const { thanhPho, phuong, diaChi } = address;

        if (thanhPho && phuong && diaChi) {
            const fullAddress = `${diaChi}, ${phuong}, ${thanhPho}`;

            setAddress(prev => ({
                ...prev,
                diaChiCuThe: fullAddress
            }));

            // nếu bạn muốn sync luôn với ChiTietCanHo
            // setChiTietCanHo(prev => ({
            //     ...prev,
            //     diaChiCuThe: fullAddress
            // }));
        }
    }, [address.thanhPho, address.phuong, address.diaChi]);

    return (
        <div className="container-listing">
            <div className="category-listing">
                <div className="title-listing">Loại chuyên mục</div>
                <div className="form-group-listing">
                    <label className="label" htmlFor="category">
                        Loại chuyên mục <span className="required">(*)</span>
                    </label>
                    <Select
                        className="select-listing"
                        placeholder="-- Chọn loại chuyên mục --"
                        style={{ width: '50%' }}
                        size="large"
                        allowClear
                    >
                        <Option value="nha-dat">Nhà đất</Option>
                        <Option value="can-ho">Căn hộ</Option>
                        <Option value="van-phong">Văn phòng</Option>
                    </Select>
                </div>
            </div>

            <div className="area-listing">
                <div className="title-listing">Khu vực</div>

                <div className="area-select">
                    <div className="area-left">
                        <div className="form-group-listing">
                            <label className="label" htmlFor="category">
                                Thành phố <span className="required">(*)</span>
                            </label>
                            <Select
                                className="select-listing"
                                placeholder="-- Chọn tỉnh/thành phố --"
                                size="large"
                                onChange={(value) =>
                                    setAddress(prev => ({ ...prev, thanhPho: value }))
                                }
                            >
                                <Option value="Đà Nẵng">Đà Nẵng</Option>
                            </Select>
                        </div>

                        <div className="form-group-listing">
                            <label className="label" htmlFor="category">
                                Phường
                            </label>
                            <Select
                                className="select-listing"
                                placeholder="-- Chọn phường/xã --"
                                size="large"
                                onChange={(value) =>
                                    setAddress(prev => ({ ...prev, phuong: value }))
                                }
                            >
                                <Option value="An Hải">An Hải</Option>
                                <Option value="Hải Châu">Hải Châu</Option>
                                <Option value="Hòa Xuân">Hòa Xuân</Option>
                            </Select>
                        </div>
                    </div>

                    <div className="area-right">
                        <div className="form-group-listing">
                            <label className="label" htmlFor="category">
                                Địa chỉ
                            </label>
                            <Input
                                className='input-height'
                                placeholder="Nhập địa chỉ"
                                onChange={(e) =>
                                    setAddress(prev => ({ ...prev, diaChi: e.target.value }))
                                }
                            />
                        </div>

                        <div className="form-group-listing">
                            <label className="label" htmlFor="category">
                                Địa chỉ cụ thể
                            </label>
                            <Input
                                className='input-height'
                                value={address.diaChiCuThe}
                                readOnly
                                style={{ backgroundColor: '#f5f5f5' }}
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
                        {isLocatingByAddress ? 'Đang định vị...' : 'Định vị theo địa chỉ'}
                    </button>
                </div>

                <div className="map-listing__address-preview">
                    <span>Địa chỉ hiện tại:</span>
                    <strong>{fullAddress || 'Chưa có địa chỉ'}</strong>
                </div>

                <div ref={mapRef} id="map" className="map-listing__map"></div>

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
                <div className="title-listing">Thông tin mô tả</div>
                <div className="form-group-listing">
                    <label className="label" htmlFor="category">
                        Tiêu đề <span className="required">(*)</span>
                    </label>
                    <TextArea rows={2} />
                </div>
                <div className="form-group-listing gap">
                    <label className="label" htmlFor="category">
                        Nội dung mô tả <span className="required">(*)</span>
                    </label>
                    <TextArea rows={10} />
                </div>
                <div className="form-group-listing gap width">
                    <label className="label" htmlFor="category">
                        Phương thức thanh toán <span className="required">(*)</span>
                    </label>
                    <Select
                        className="select-listing"
                        placeholder="-- Chọn phương thức thanh toán --"
                        size="large"
                    >
                        <Option value="Cash">Tiền mặt</Option>
                        <Option value="Transfer">Chuyển khoản</Option>
                    </Select>
                </div>
                <div className="form-group-listing gap">
                    <label className="label" htmlFor="category">
                        Giá cho thuê <span className="required">(*)</span>
                    </label>
                    <Input
                        className='input-height input-width'
                        placeholder="Nhập giá thuê"
                    />
                    <span className='listing-span'>Nhập đầy đủ số, ví dụ 1 triệu thì nhập là 1000000</span>
                </div>
                <div className="form-group-listing gap">
                    <label className="label" htmlFor="category">
                        Diện tích <span className="required">(*)</span>
                    </label>
                    <Input
                        className='input-height input-width'
                        placeholder="Nhập diện tích"
                    />
                    <span className='listing-span'>Đơn vị tính: m<sup>2</sup></span>
                </div>
                <div className="form-group-listing gap width">
                    <label className="label" htmlFor="category">
                        Phòng ngủ <span className="required">(*)</span>
                    </label>
                    <Select
                        className="select-listing"
                        placeholder="-- Chọn phòng ngủ --"
                        size="large"
                    >
                        <Option value="1">1 phòng ngủ</Option>
                        <Option value="2">2 phòng ngủ</Option>
                        <Option value="3">3 phòng ngủ</Option>
                    </Select>
                </div>
                <div className="form-group-listing gap width">
                    <label className="label" htmlFor="category">
                        Hướng căn hộ <span className="required">(*)</span>
                    </label>
                    <Select
                        className="select-listing"
                        placeholder="-- Chọn hướng căn hộ --"
                        size="large"
                    >
                        <Option value="North">Đông</Option>
                        <Option value="West">Tây</Option>
                        <Option value="South">Nam</Option>
                        <Option value="East">Bắc</Option>
                        <Option value="Northeast">Đông Bắc</Option>
                        <Option value="Southeast">Đông Nam</Option>
                        <Option value="Northwest">Tây Bắc</Option>
                        <Option value="Southwest">Tây Nam</Option>
                    </Select>
                </div>
            </div>

            <div className="features-listing">
                <div className="title-listing">Điểm nổi bật</div>
                <Checkbox.Group style={{ width: '100%' }}>
                    <Row>
                        <Col span={8}>
                            <Checkbox value="A">Đầy đủ nội thất</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="B">Có máy lạnh</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="C">Có thang máy</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="D">Có bảo vệ 24/24</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Có máy giặt</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Không chung chủ</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Có hầm để xe</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Có kệ bếp</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Có tủ lạnh</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Giờ giấc tự do</Checkbox>
                        </Col>
                        <Col span={8}>
                            <Checkbox value="E">Có ban công</Checkbox>
                        </Col>
                    </Row>
                </Checkbox.Group>
            </div>

            <div className="img-listing">
                <div className="title-listing">Hình ảnh</div>

                {/* Khu vực upload ảnh */}
                <div className="browse_photos" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-image">
                        <img className="icon-upload-image" src={Image} alt="upload icon" />
                        <span className="upload-text">{isUploading ? 'Đang đăng hình...' : 'Tải ảnh từ thiết bị'}</span>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleSelectImages}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Ghi chú upload */}
                <div className="note-span">
                    <span className="listing-span">• Tải lên tối đa 20 ảnh trong một bài đăng</span>
                    <span className="listing-span">• Dung lượng ảnh tối đa 10MB</span>
                    <span className="listing-span">• Hình ảnh phải liên quan đến phòng trọ, nhà cho thuê</span>
                    <span className="listing-span">• Không chèn văn bản, số điện thoại lên ảnh</span>
                </div>

                {/* Danh sách ảnh đã chọn */}
                <div className="image-grid">
                    {images.map((img) => (
                        <div key={img.id} className="image-card">
                            <img src={img.url} alt="preview" />
                            <button onClick={() => handleRemove(img.id)} className="delete-btn">🗑️ Xóa</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="video-listing">
                <div className="title-listing">Video</div>

                <div className="browse_photos" onClick={() => videoInputRef.current?.click()}>
                    <div className="upload-image">
                        <img className="icon-upload-image" src={Video} alt="upload icon" />
                        <span className="upload-text">
                            {isUploadingVideo ? "Đang đăng video..." : video ? "Thay đổi video" : "Tải video từ thiết bị"}
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

                {video && (
                    <div className="video-preview">
                        <video controls width="100%" src={video.url} />
                        <button onClick={() => setVideo(null)} className="delete-btn">🗑️ Xóa video</button>
                    </div>
                )}
            </div>

            <div className="contact-listing">
                <div className="title-listing">Thông tin liên hệ</div>
                <div className="contact-flex">
                    <div className="form-group-listing">
                        <label className="label" htmlFor="category">
                            Họ Tên
                        </label>
                        <Input
                            className='input-height'
                            placeholder="Nguyễn Đức Thắng"
                            value="Nguyễn Đức Thắng"
                            readOnly
                            onChange={() => { }}
                        />
                    </div>
                    <div className="form-group-listing">
                        <label className="label" htmlFor="category">
                            Số điện thoại
                        </label>
                        <Input
                            className="input-height"
                            placeholder="0325043590"
                            value="0325043590"
                            readOnly
                            onChange={() => { }}
                        />
                    </div>
                </div>
            </div>

            <div className="button-listing">
                <Button
                    type="primary"
                    className="continue-btn"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    block
                >
                    Tiếp tục
                </Button>
            </div>
        </div>
    )
}

export default Listing