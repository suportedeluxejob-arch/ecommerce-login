import * as React from "react";
import { motion } from "framer-motion";
import './StatusCard.css';

interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  illustration?: string;
  illustrationAlt?: string;
  children?: React.ReactNode;
}

const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ className = "", icon, title, description, illustration, illustrationAlt = "Decorative illustration", children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`status-card ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        {...(props as any)}
      >
        <div className="status-card-inner">
          {icon && <div className="status-card-icon">{icon}</div>}
          
          <div className="status-card-content">
            <h3 className="status-card-title">{title}</h3>
            <p className="status-card-desc">{description}</p>
          </div>

          {children && <div className="status-card-children">{children}</div>}
        </div>

        {illustration && (
          <div className="status-card-illustration-wrap">
            <img
              src={illustration}
              alt={illustrationAlt}
              className="status-card-illustration-img"
            />
          </div>
        )}
      </motion.div>
    );
  }
);

StatusCard.displayName = "StatusCard";

export { StatusCard };
