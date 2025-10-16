import React from 'react';
import { Order } from '../../lib/api';

interface OrderTrackingProps {
  order: Order;
}

const statusSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderTracking({ order }: OrderTrackingProps) {
  const currentStatusIndex = statusSteps.indexOf(order.status);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {statusSteps.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          const isCompleted = index < currentStatusIndex;

          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center text-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-primary text-white scale-110' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </div>
                <p className={`mt-2 text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                </p>
              </div>
              {index < statusSteps.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}