import { useState } from "react";
import { Button, Input, Tag } from "antd";
import {
    SearchOutlined,
    CameraOutlined,
    EditOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import "./listPost.css";
import cloverImg from "../../../../assets/img/co4la.png";

interface PostItem {
    id: number;
    title: string;
    price: string;
    area: string;
    location: string;
    postId: string;
    thumbnail?: string;
    imageCount: number;
    status: string;
    type: string;
    startDate: string;
    endDate: string;
    roomStatus: "AVAILABLE" | "RENTED";
}

const initialPosts: PostItem[] = [
    {
        id: 1,
        title:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        price: "1.001 đồng/tháng",
        area: "11 m²",
        location: "Cho thuê căn hộ Quận Hải Châu, Đà Nẵng",
        postId: "685701",
        thumbnail: "",
        imageCount: 2,
        status: "CHỜ THANH TOÁN",
        type: "CĂN HỘ",
        startDate: "2026-04-10",
        endDate: "2026-05-10",
        roomStatus: "AVAILABLE",
    },
    {
        id: 2,
        title: "Chính chủ cho thuê phòng trọ mới xây 100%",
        price: "2.500.000 đồng/tháng",
        area: "18 m²",
        location: "Quận Sơn Trà, Đà Nẵng",
        postId: "685702",
        thumbnail: "",
        imageCount: 3,
        status: "ĐANG HIỂN THỊ",
        type: "PHÒNG TRỌ",
        startDate: "2026-04-12",
        endDate: "2026-05-12",
        roomStatus: "RENTED",
    },
    {
        id: 3,
        title: "Cho thuê mặt bằng tầng trệt trung tâm thành phố",
        price: "10.000.000 đồng/tháng",
        area: "50 m²",
        location: "Quận Thanh Khê, Đà Nẵng",
        postId: "685703",
        thumbnail: "",
        imageCount: 4,
        status: "HẾT HẠN",
        type: "MẶT BẰNG",
        startDate: "2026-03-01",
        endDate: "2026-04-01",
        roomStatus: "AVAILABLE",
    },
    {
        id: 4,
        title: "Cho thuê căn hộ studio đầy đủ nội thất",
        price: "5.000.000 đồng/tháng",
        area: "25 m²",
        location: "Quận Ngũ Hành Sơn, Đà Nẵng",
        postId: "685704",
        thumbnail: "",
        imageCount: 1,
        status: "CHỜ DUYỆT",
        type: "CĂN HỘ",
        startDate: "2026-04-15",
        endDate: "2026-05-15",
        roomStatus: "AVAILABLE",
    },
    {
        id: 5,
        title: "Phòng trọ mới xây gần trường đại học",
        price: "1.800.000 đồng/tháng",
        area: "16 m²",
        location: "Quận Liên Chiểu, Đà Nẵng",
        postId: "685705",
        thumbnail: "",
        imageCount: 2,
        status: "ẨN TIN",
        type: "PHÒNG TRỌ",
        startDate: "2026-04-18",
        endDate: "2026-05-18",
        roomStatus: "RENTED",
    },
];

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "ĐANG HIỂN THỊ":
            return "green";
        case "CHỜ DUYỆT":
            return "processing";
        case "CHỜ THANH TOÁN":
            return "gold";
        case "HẾT HẠN":
            return "red";
        case "ẨN TIN":
            return "default";
        default:
            return "blue";
    }
};

const ListPost = () => {
    const [searchValue, setSearchValue] = useState("");
    const [postList, setPostList] = useState<PostItem[]>(initialPosts);

    const toggleRoomStatus = (id: number) => {
        setPostList((prev) =>
            prev.map((post) =>
                post.id === id
                    ? {
                        ...post,
                        roomStatus:
                            post.roomStatus === "AVAILABLE" ? "RENTED" : "AVAILABLE",
                    }
                    : post
            )
        );
    };

    const filteredPosts = postList.filter((post) => {
        const keyword = searchValue.trim().toLowerCase();
        if (!keyword) return true;

        return (
            post.title.toLowerCase().includes(keyword) ||
            post.postId.toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="post-container">
            <div className="post-page-header">
                <div className="post-page-heading">
                    <h2 className="post-page-title">Danh sách bài đăng</h2>
                    <p className="post-page-subtitle">
                        Quản lý các bài đăng của bạn trực quan và dễ dàng hơn
                    </p>
                </div>

                <Input
                    className="search-input-post"
                    placeholder="Tìm theo mã tin hoặc tiêu đề"
                    prefix={<SearchOutlined />}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </div>

            <div className="list-container">
                {filteredPosts.map((post) => (
                    <div key={post.id} className="post-card">
                        <div className="post-thumbnail">
                            <img
                                src={post.thumbnail?.trim() ? post.thumbnail : cloverImg}
                                alt={post.title}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = cloverImg;
                                }}
                            />

                            <div className="post-overlay">
                                <Tag color={getStatusColor(post.status)}>{post.status}</Tag>
                            </div>

                            <div className="post-camera-icon">
                                <CameraOutlined />
                                <span>{post.imageCount}</span>
                            </div>
                        </div>

                        <div className="post-info">
                            <div className="post-top-row">
                                <div className="post-badge-group">
                                    <Tag color="blue">{post.type}</Tag>
                                    <Tag color={post.roomStatus === "AVAILABLE" ? "green" : "red"}>
                                        {post.roomStatus === "AVAILABLE" ? "Còn trống" : "Đã cho thuê"}
                                    </Tag>
                                </div>
                            </div>

                            <h3 className="post-title">{post.title}</h3>

                            <div className="post-meta">
                                <span className="post-price">{post.price}</span>
                                <span className="meta-dot">•</span>
                                <span className="post-size">{post.area}</span>
                                <span className="meta-dot">•</span>
                                <span className="post-location">{post.location}</span>
                            </div>

                            <div className="post-details">
                                <div className="post-detail-item">
                                    <span className="label">Mã tin</span>
                                    <strong>{post.postId}</strong>
                                </div>

                                <div className="post-detail-item">
                                    <span className="label">Ngày bắt đầu</span>
                                    <strong>{formatDate(post.startDate)}</strong>
                                </div>

                                <div className="post-detail-item">
                                    <span className="label">Ngày kết thúc</span>
                                    <strong>{formatDate(post.endDate)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="post-actions">
                            <Button className="edit-btn" icon={<EditOutlined />}>
                                Sửa tin
                            </Button>

                            <Button
                                className={`status-btn ${post.roomStatus === "AVAILABLE" ? "available" : "rented"
                                    }`}
                                icon={<HomeOutlined />}
                                onClick={() => toggleRoomStatus(post.id)}
                            >
                                {post.roomStatus === "AVAILABLE" ? "Còn trống" : "Đã cho thuê"}
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredPosts.length === 0 && (
                    <div className="empty-post">Không tìm thấy bài đăng phù hợp.</div>
                )}
            </div>
        </div>
    );
};

export default ListPost;