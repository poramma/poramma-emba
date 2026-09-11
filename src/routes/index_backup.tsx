import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routeDefinitions } from './route-definitions';
import { RouteGuard } from './route-guards';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {routeDefinitions.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RouteGuard requiredRoles={route.roles}>
              {route.element}
            </RouteGuard>
          }
        />
      ))}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

