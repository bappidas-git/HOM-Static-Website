import React from 'react';
import { useParams } from 'react-router-dom';
import PropertyListing from './PropertyListing';

/**
 * Dynamic rent category page — handles any /rent/:category route.
 * Delegates to PropertyListing with a dynamically constructed routePath.
 */
const RentCategory = () => {
  const { category } = useParams();
  return <PropertyListing routePath={`/rent/${category}`} />;
};

export default RentCategory;
