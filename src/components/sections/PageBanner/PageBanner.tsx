import React from 'react';
import { Link } from 'react-router-dom';
import './PageBanner.css';

type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface PageBannerProps {
  title: string;
  backgroundImage: string;
  breadcrumbs?: BreadcrumbItem[];
  height?: 'sm' | 'md' | 'lg';
}

const PageBanner: React.FC<PageBannerProps> = ({
  title,
  backgroundImage,
  breadcrumbs = [],
  height = 'md',
}) => {
  return (
    <section
      className={`page-banner page-banner--${height}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="page-banner__overlay" />

      <div className="page-banner__container">
        <div className="page-banner__content">
          <h1 className="page-banner__title">{title}</h1>

          {breadcrumbs.length > 0 && (
            <div className="page-banner__breadcrumbs">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {item.to && !isLast ? (
                      <Link to={item.to} className="page-banner__breadcrumb-link">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="page-banner__breadcrumb-current">
                        {item.label}
                      </span>
                    )}

                    {!isLast && <span className="page-banner__breadcrumb-separator">/</span>}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageBanner;