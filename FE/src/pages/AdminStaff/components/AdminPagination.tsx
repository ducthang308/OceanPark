import React from 'react';
import { Pagination } from 'antd';
import './admin-pagination.css';

interface AdminPaginationProps {
  current: number;
  itemLabel: string;
  onChange: (page: number, pageSize: number) => void;
  pageSize: number;
  total: number;
}

const pageSizeOptions = ['5', '10', '20', '50'];

const AdminPagination: React.FC<AdminPaginationProps> = ({
  current,
  itemLabel,
  onChange,
  pageSize,
  total,
}) => {
  const startItem = total > 0 ? (current - 1) * pageSize + 1 : 0;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className="admin-pagination">
      <div className="admin-pagination__summary">
        Hiển thị {startItem}-{endItem} / {total} {itemLabel}
      </div>

      <Pagination
        current={current}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger={total > Number(pageSizeOptions[0])}
        size="small"
        total={total}
        onChange={onChange}
      />
    </div>
  );
};

export default AdminPagination;
