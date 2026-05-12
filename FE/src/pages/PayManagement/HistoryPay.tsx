import React, { useState, useEffect } from "react";
import "./HistoryPay.css";
import { Link, useSearchParams } from "react-router-dom";
import { Tag, Table, Button, Card } from "antd";
import Navbar from "../../components/layout/Navbar/navbar";

const History = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'recharge';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [depositHistoryData, setDepositHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'recharge');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const packageColumns = [
    { title: "Tên gói", dataIndex: "name", key: "name" },
    { title: "Ngày kích hoạt", dataIndex: "startDate", key: "startDate" },
    { title: "Ngày hết hạn", dataIndex: "endDate", key: "endDate" },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Đang hoạt động" ? "green" : "red"}>{status}</Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: () => <Button type="link">Gia hạn</Button>
    }
  ];

  const packagesData = [
    { id: 1, name: "Tin VIP Nổi Bật (30 ngày)", startDate: "10/05/2026", endDate: "10/06/2026", status: "Đang hoạt động" },
    { id: 2, name: "Tin VIP 1 (15 ngày)", startDate: "01/05/2026", endDate: "16/05/2026", status: "Đang hoạt động" },
  ];

  const transactionColumns = [
    { title: "Thời gian", dataIndex: "time", key: "time" },
    { title: "Loại giao dịch", dataIndex: "type", key: "type" },
    { 
      title: "Số tiền", 
      dataIndex: "amount", 
      key: "amount",
      render: (v: number) => <span style={{ color: v > 0 ? "#52c41a" : "#ff4d4f" }}>{v.toLocaleString()} đ</span>
    },
    { title: "Nội dung", dataIndex: "note", key: "note" },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Thành công" ? "green" : "orange"}>{status}</Tag>
      )
    },
  ];

  const transactionData = [
    { id: 1, time: "12/05/2026 09:30", type: "Nạp tiền", amount: 500000, note: "Nạp qua MoMo", status: "Thành công" },
    { id: 2, time: "12/05/2026 10:00", type: "Mua gói", amount: -351000, note: "Mua gói VIP Nổi Bật", status: "Thành công" },
    { id: 3, time: "11/05/2026 15:20", type: "Nạp tiền", amount: 100000, note: "Nạp qua Chuyển khoản", status: "Thành công" },
  ];

  return (
    <>
      <div className="main-layout">
        <Navbar />
        <div className="content-area">
          <main className="history-content">
            <div className="history-header">
              <h1>Quản lý tài chính</h1>
              <Link to="/payment/all">
                <Button type="primary" size="large">Mua gói tin ngay</Button>
              </Link>
            </div>

            <nav className="history-tabs">
              <button
                className={`tab-btn ${activeTab === "recharge" ? "active" : ""}`}
                onClick={() => handleTabChange("recharge")}
              >
                Mua gói mới
              </button>
              <button
                className={`tab-btn ${activeTab === "package" ? "active" : ""}`}
                onClick={() => handleTabChange("package")}
              >
                Quản lý gói nạp
              </button>
              <button
                className={`tab-btn ${activeTab === "transaction" ? "active" : ""}`}
                onClick={() => handleTabChange("transaction")}
              >
                Lịch sử giao dịch
              </button>
            </nav>

            <div className="container">
              <div className="history-wrapper">
                {activeTab === "recharge" && (
                  <div className="recharge-section" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="history-note" style={{ maxWidth: 600, margin: '0 auto 30px' }}>
                      <strong>Mua gói dịch vụ mới</strong>
                      <p>Vui lòng chọn gói tin phù hợp từ bảng giá dịch vụ để thực hiện thanh toán và kích hoạt tin đăng.</p>
                    </div>
                    <Link to="/payment/all">
                      <Button type="primary" size="large" style={{ height: 50, padding: '0 40px', fontSize: 18 }}>
                        Xem bảng giá & Mua gói ngay
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "package" && (
                  <div className="package-section">
                    <h2>Gói tin đang hoạt động</h2>
                    <Table 
                      columns={packageColumns} 
                      dataSource={packagesData} 
                      rowKey="id" 
                      pagination={false}
                    />
                    <div style={{ marginTop: 24 }}>
                      <Card title="Hướng dẫn sử dụng gói tin">
                        <p>1. Chọn gói tin phù hợp với nhu cầu hiển thị của bạn.</p>
                        <p>2. Sau khi mua, gói tin sẽ được cộng vào tài khoản và có thể áp dụng khi đăng tin mới.</p>
                        <p>3. Bạn có thể gia hạn gói tin bất cứ lúc nào để duy trì vị trí hiển thị.</p>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "transaction" && (
                  <div className="transaction-section">
                    <h2>Lịch sử giao dịch</h2>
                    <Table 
                      columns={transactionColumns} 
                      dataSource={transactionData} 
                      rowKey="id"
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default History;
