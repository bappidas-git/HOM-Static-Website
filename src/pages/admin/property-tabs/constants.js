export const TAB_CONFIG = [
  { key: 'gallery', label: 'Gallery', icon: 'mdi:image-multiple-outline' },
  { key: 'basicInfo', label: 'Basic Info', icon: 'mdi:information-outline' },
  { key: 'overview', label: 'Overview', icon: 'mdi:text-box-outline' },
  { key: 'details', label: 'Details', icon: 'mdi:clipboard-list-outline' },
  { key: 'highlights', label: 'Highlights', icon: 'mdi:star-circle-outline' },
  { key: 'amenities', label: 'Amenities', icon: 'mdi:pool' },
  { key: 'floorPlans', label: 'Floor Plans & Pricing', icon: 'mdi:layers-outline' },
  { key: 'nearbyPlaces', label: 'Nearby Places', icon: 'mdi:map-marker-radius-outline' },
  { key: 'documents', label: 'Property Documents', icon: 'mdi:file-document-outline' },
  { key: 'constructionSpecs', label: 'Construction Specifications', icon: 'mdi:crane' },
  { key: 'constructionStatus', label: 'Construction Status', icon: 'mdi:progress-clock' },
  { key: 'developer', label: 'Developer', icon: 'mdi:domain' },
  { key: 'faqs', label: 'FAQs', icon: 'mdi:frequently-asked-questions' },
  { key: 'similarProperties', label: 'Similar Properties', icon: 'mdi:home-group' },
  { key: 'seoTags', label: 'SEO & Tags', icon: 'mdi:search-web' },
];

export const CONFIGURATION_OPTIONS = [
  '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK',
  '4 BHK', '4.5 BHK', '5 BHK', '6 BHK',
  '1 RK', 'Studio', 'Duplex', 'Penthouse',
];

export const AMENITY_CATEGORIES = {
  sports: {
    label: 'Sports',
    icon: 'mdi:basketball',
    items: [
      { icon: 'mdi:basketball', name: 'Basketball Court' },
      { icon: 'mdi:tennis', name: 'Tennis Court' },
      { icon: 'mdi:badminton', name: 'Badminton Court' },
      { icon: 'mdi:cricket', name: 'Cricket Pitch' },
      { icon: 'mdi:football', name: 'Football Ground' },
      { icon: 'mdi:table-tennis', name: 'Table Tennis' },
      { icon: 'mdi:billiards', name: 'Billiards Room' },
    ],
  },
  leisure: {
    label: 'Leisure',
    icon: 'mdi:palm-tree',
    items: [
      { icon: 'mdi:swim', name: 'Swimming Pool' },
      { icon: 'mdi:party-popper', name: 'Clubhouse' },
      { icon: 'mdi:tree', name: 'Landscaped Gardens' },
      { icon: 'mdi:baby-carriage', name: 'Kids Play Area' },
      { icon: 'mdi:movie-open-outline', name: 'Mini Theatre' },
      { icon: 'mdi:grill-outline', name: 'BBQ Area' },
      { icon: 'mdi:book-open-variant', name: 'Library' },
    ],
  },
  fitness: {
    label: 'Fitness',
    icon: 'mdi:dumbbell',
    items: [
      { icon: 'mdi:dumbbell', name: 'Gymnasium' },
      { icon: 'mdi:yoga', name: 'Yoga Room' },
      { icon: 'mdi:run', name: 'Jogging Track' },
      { icon: 'mdi:meditation', name: 'Meditation Zone' },
      { icon: 'mdi:spa-outline', name: 'Spa & Sauna' },
    ],
  },
  safety: {
    label: 'Safety',
    icon: 'mdi:shield-check',
    items: [
      { icon: 'mdi:shield-check', name: '24/7 Security' },
      { icon: 'mdi:cctv', name: 'CCTV Surveillance' },
      { icon: 'mdi:fire-extinguisher', name: 'Fire Safety' },
      { icon: 'mdi:gate', name: 'Gated Community' },
      { icon: 'mdi:intercom', name: 'Video Door Phone' },
    ],
  },
  convenience: {
    label: 'Convenience',
    icon: 'mdi:car-parking',
    items: [
      { icon: 'mdi:car-parking', name: 'Covered Parking' },
      { icon: 'mdi:lightning-bolt', name: 'Power Backup' },
      { icon: 'mdi:water-pump', name: 'Water Supply' },
      { icon: 'mdi:elevator', name: 'High-Speed Elevators' },
      { icon: 'mdi:ev-station', name: 'EV Charging' },
      { icon: 'mdi:wifi', name: 'Wi-Fi Connectivity' },
      { icon: 'mdi:gas-cylinder', name: 'Piped Gas' },
    ],
  },
};

export const NEARBY_TYPES = [
  'school', 'hospital', 'shopping', 'transport',
  'workplace', 'restaurant', 'park', 'bank', 'landmark', 'entertainment',
];

export const TAG_OPTIONS = [
  { value: 'featured', label: 'Featured', color: '#B45309', bg: '#FEF3C7', icon: 'mdi:star' },
  { value: 'popular', label: 'Popular', color: '#0891B2', bg: '#CFFAFE', icon: 'mdi:fire' },
  { value: 'just-launched', label: 'Just Launched', color: '#4F46E5', bg: '#E0E7FF', icon: 'mdi:rocket-launch' },
  { value: 'premium', label: 'Premium', color: '#7C3AED', bg: '#EDE9FE', icon: 'mdi:diamond-stone' },
  { value: 'hot-deal', label: 'Hot Deal', color: '#DC2626', bg: '#FEE2E2', icon: 'mdi:tag-heart' },
  { value: 'trending', label: 'Trending', color: '#1D4ED8', bg: '#DBEAFE', icon: 'mdi:trending-up' },
  { value: 'new-launch', label: 'New Launch', color: '#059669', bg: '#D1FAE5', icon: 'mdi:new-box' },
];

export const CONSTRUCTION_SPEC_CATEGORIES = [
  'flooring', 'doors', 'structure', 'electrical', 'plumbing', 'others',
];

export const DRAFT_STORAGE_KEY = 'hom_property_draft';

export const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

export const getDefaultFormData = () => ({
  title: '',
  slug: '',
  type: 'sale',
  propertyType: 'apartment',
  status: 'pre-launch',
  publishStatus: 'draft',
  price: '',
  priceUnit: 'onwards',
  developer: '',
  description: '',
  highlights: [''],
  location: { area: '', city: '', state: '', lat: '', lng: '', address: '' },
  configuration: [],
  dimensionRange: { min: '', max: '', unit: 'sqft' },
  possession: '',
  specifications: [{ key: '', value: '', icon: '' }],
  amenities: [],
  floorPlans: [{ config: '', area: '', price: '', image: '', bedrooms: '', bathrooms: '' }],
  gallery: [''],
  nearbyPlaces: [{ name: '', distance: '', type: 'school' }],
  brochureUrl: '',
  floorPlanPdfUrl: '',
  specialities: [{ icon: '', name: '', description: '' }],
  documents: [{ name: '', icon: 'mdi:file-document', url: '' }],
  constructionSpecs: {
    flooring: [{ area: '', spec: '' }],
    doors: [{ area: '', spec: '' }],
    structure: [{ area: '', spec: '' }],
    electrical: [{ area: '', spec: '' }],
  },
  constructionTimeline: [
    { label: 'Foundation', status: 'pending', icon: 'mdi:shovel' },
    { label: 'Structure', status: 'pending', icon: 'mdi:crane' },
    { label: 'Finishing', status: 'pending', icon: 'mdi:format-paint' },
    { label: 'Handover', status: 'pending', icon: 'mdi:key-variant' },
  ],
  developerInfo: {
    name: '',
    description: '',
    logo: '',
    stats: [
      { value: '', suffix: '+', label: 'Years Experience', icon: 'mdi:calendar-star' },
      { value: '', suffix: '+', label: 'Projects Completed', icon: 'mdi:office-building' },
    ],
  },
  faqs: [{ question: '', answer: '' }],
  similarPropertyIds: [],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterCard: 'summary_large_image',
  canonicalUrl: '',
  schemaMarkup: '',
  tags: [],
  isActive: true,
});
