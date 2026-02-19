import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { propertyService } from '../../services/api';

// ============ CONSTANTS ============

const TAB_LABELS = [
  { label: 'Basic Info', icon: 'mdi:information-outline' },
  { label: 'Location', icon: 'mdi:map-marker-outline' },
  { label: 'Configuration', icon: 'mdi:floor-plan' },
  { label: 'Specifications', icon: 'mdi:clipboard-list-outline' },
  { label: 'Amenities', icon: 'mdi:pool' },
  { label: 'Floor Plans', icon: 'mdi:layers-outline' },
  { label: 'Gallery', icon: 'mdi:image-multiple-outline' },
  { label: 'Nearby Places', icon: 'mdi:map-marker-radius-outline' },
  { label: 'Specialities & Docs', icon: 'mdi:star-circle-outline' },
  { label: 'Construction Specs', icon: 'mdi:crane' },
  { label: 'SEO & Tags', icon: 'mdi:search-web' },
];

const CONFIGURATION_OPTIONS = [
  '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', '6 BHK',
  '1 RK', 'Studio', 'Duplex', 'Penthouse',
];

const AMENITY_CATEGORIES = {
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

const NEARBY_TYPES = ['school', 'hospital', 'shopping', 'transport', 'workplace', 'restaurant', 'park', 'bank'];

const TAG_OPTIONS = [
  { value: 'featured', label: 'Featured', color: '#B45309', bg: '#FEF3C7' },
  { value: 'trending', label: 'Trending', color: '#1D4ED8', bg: '#DBEAFE' },
  { value: 'premium', label: 'Premium', color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'hot-deal', label: 'Hot Deal', color: '#DC2626', bg: '#FEE2E2' },
  { value: 'new-launch', label: 'New Launch', color: '#059669', bg: '#D1FAE5' },
];

const DRAFT_STORAGE_KEY = 'hom_property_draft';

// ============ DEFAULT FORM DATA ============

const CONSTRUCTION_SPEC_CATEGORIES = ['flooring', 'doors', 'structure', 'electrical', 'plumbing', 'others'];

const getDefaultFormData = () => ({
  title: '',
  slug: '',
  type: 'sale',
  propertyType: 'apartment',
  status: 'pre-launch',
  price: '',
  priceUnit: 'onwards',
  developer: '',
  description: '',
  highlights: [''],
  location: { area: '', city: '', state: '', lat: '', lng: '' },
  address: '',
  configuration: [],
  dimensionRange: { min: '', max: '', unit: 'sqft' },
  possession: '',
  specifications: [{ key: '', value: '' }],
  amenities: [],
  floorPlans: [{ config: '', area: '', price: '', image: '', bedrooms: '', bathrooms: '' }],
  gallery: [''],
  nearbyPlaces: [{ name: '', distance: '', type: 'school' }],
  brochureUrl: '',
  floorPlanPdfUrl: '',
  specialities: [{ icon: '', name: '', description: '' }],
  documents: [{ name: '', icon: 'mdi:file-document' }],
  constructionSpecs: {
    flooring: [{ area: '', spec: '' }],
    doors: [{ area: '', spec: '' }],
    structure: [{ area: '', spec: '' }],
    electrical: [{ area: '', spec: '' }],
  },
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  schemaMarkup: '',
  tags: [],
  isActive: true,
});

// ============ SLUG HELPER ============

const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

// ============ MAIN COMPONENT ============

const PropertyForm = ({ propertyId = null }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEdit = Boolean(propertyId);

  const [formData, setFormData] = useState(getDefaultFormData());
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [seoKeywordInput, setSeoKeywordInput] = useState('');
  const [customAmenityDialog, setCustomAmenityDialog] = useState(false);
  const [customAmenity, setCustomAmenity] = useState({ name: '', icon: 'mdi:star-outline', category: 'convenience' });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const autoSaveTimerRef = useRef(null);

  // ---- Load property data for edit ----
  useEffect(() => {
    if (!isEdit) return;
    const loadProperty = async () => {
      try {
        setLoading(true);
        const property = await propertyService.getById(propertyId);
        if (!property) {
          setSnackbar({ open: true, message: 'Property not found', severity: 'error' });
          navigate('/admin/properties');
          return;
        }

        // Map API data to form state
        const specs = property.specifications || {};
        const specEntries = Object.entries(specs).map(([key, value]) => ({
          key,
          value: String(value),
        }));

        setFormData({
          title: property.title || '',
          slug: property.slug || '',
          type: property.type || 'sale',
          propertyType: property.propertyType || 'apartment',
          status: property.status || 'pre-launch',
          price: property.price || '',
          priceUnit: property.priceUnit || 'onwards',
          developer: property.developer || '',
          description: property.description || '',
          highlights: property.highlights?.length ? property.highlights : [''],
          location: {
            area: property.location?.area || '',
            city: property.location?.city || '',
            state: property.location?.state || '',
            lat: property.location?.lat || '',
            lng: property.location?.lng || '',
          },
          address: property.address || '',
          configuration: property.configuration || [],
          dimensionRange: {
            min: property.dimensionRange?.min || '',
            max: property.dimensionRange?.max || '',
            unit: property.dimensionRange?.unit || 'sqft',
          },
          possession: property.possession || '',
          specifications: specEntries.length ? specEntries : [{ key: '', value: '' }],
          amenities: property.amenities || [],
          floorPlans: property.floorPlans?.length
            ? property.floorPlans
            : [{ config: '', area: '', price: '', image: '', bedrooms: '', bathrooms: '' }],
          gallery: property.gallery?.length ? property.gallery : [''],
          nearbyPlaces: property.nearbyPlaces?.length
            ? property.nearbyPlaces
            : [{ name: '', distance: '', type: 'school' }],
          brochureUrl: property.brochureUrl || '',
          floorPlanPdfUrl: property.floorPlanPdfUrl || '',
          specialities: property.specialities?.length
            ? property.specialities
            : [{ icon: '', name: '', description: '' }],
          documents: property.documents?.length
            ? property.documents
            : [{ name: '', icon: 'mdi:file-document' }],
          constructionSpecs: {
            flooring: property.constructionSpecs?.flooring?.length
              ? property.constructionSpecs.flooring
              : [{ area: '', spec: '' }],
            doors: property.constructionSpecs?.doors?.length
              ? property.constructionSpecs.doors
              : [{ area: '', spec: '' }],
            structure: property.constructionSpecs?.structure?.length
              ? property.constructionSpecs.structure
              : [{ area: '', spec: '' }],
            electrical: property.constructionSpecs?.electrical?.length
              ? property.constructionSpecs.electrical
              : [{ area: '', spec: '' }],
          },
          seoTitle: property.seoTitle || '',
          seoDescription: property.seoDescription || '',
          seoKeywords: property.seoKeywords || [],
          schemaMarkup: property.schemaMarkup || '',
          tags: property.tags || [],
          isActive: property.isActive !== undefined ? property.isActive : true,
        });
        setSlugManuallyEdited(true);
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load property data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadProperty();
  }, [isEdit, propertyId, navigate]);

  // ---- Load draft for new properties ----
  useEffect(() => {
    if (isEdit) return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setSnackbar({ open: true, message: 'Draft restored from local storage', severity: 'info' });
      }
    } catch {
      // ignore parse errors
    }
  }, [isEdit]);

  // ---- Auto-save draft every 30s for new properties ----
  useEffect(() => {
    if (isEdit) return;
    autoSaveTimerRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }, 30000);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [formData, isEdit]);

  // ---- Field updaters ----
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateLocation = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }, []);

  const updateDimensionRange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      dimensionRange: { ...prev.dimensionRange, [field]: value },
    }));
  }, []);

  // ---- Auto-generate slug from title ----
  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, slugManuallyEdited]);

  // ---- Validation ----
  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Property name is required';
    if (!formData.slug.trim()) errs.slug = 'Slug is required';
    if (!formData.price || Number(formData.price) <= 0) errs.price = 'Valid price is required';
    if (!formData.developer.trim()) errs.developer = 'Developer name is required';
    if (!formData.location.area.trim()) errs['location.area'] = 'Area is required';
    if (!formData.location.city.trim()) errs['location.city'] = 'City is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Build API payload ----
  const buildPayload = () => {
    // Convert specifications array to object
    const specsObj = {};
    formData.specifications.forEach((s) => {
      if (s.key.trim()) {
        const val = isNaN(Number(s.value)) ? s.value : Number(s.value);
        specsObj[s.key.trim()] = val;
      }
    });

    return {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      type: formData.type,
      propertyType: formData.propertyType,
      status: formData.status,
      price: Number(formData.price),
      priceUnit: formData.priceUnit,
      developer: formData.developer.trim(),
      description: formData.description.trim(),
      highlights: formData.highlights.filter((h) => h.trim()),
      location: {
        area: formData.location.area.trim(),
        city: formData.location.city.trim(),
        state: formData.location.state.trim(),
        lat: formData.location.lat ? Number(formData.location.lat) : null,
        lng: formData.location.lng ? Number(formData.location.lng) : null,
      },
      configuration: formData.configuration,
      dimensionRange: {
        min: formData.dimensionRange.min ? Number(formData.dimensionRange.min) : null,
        max: formData.dimensionRange.max ? Number(formData.dimensionRange.max) : null,
        unit: formData.dimensionRange.unit,
      },
      possession: formData.possession,
      specifications: specsObj,
      amenities: formData.amenities,
      floorPlans: formData.floorPlans.filter((fp) => fp.config.trim()),
      gallery: formData.gallery.filter((g) => g.trim()),
      nearbyPlaces: formData.nearbyPlaces.filter((np) => np.name.trim()),
      brochureUrl: formData.brochureUrl?.trim() || '',
      floorPlanPdfUrl: formData.floorPlanPdfUrl?.trim() || '',
      specialities: formData.specialities.filter((s) => s.name.trim()),
      documents: formData.documents.filter((d) => d.name.trim()),
      constructionSpecs: Object.fromEntries(
        Object.entries(formData.constructionSpecs).filter(
          ([, items]) => Array.isArray(items) && items.some((item) => item.area.trim() && item.spec.trim())
        ).map(([key, items]) => [key, items.filter((item) => item.area.trim() && item.spec.trim())])
      ),
      seoTitle: formData.seoTitle.trim(),
      seoDescription: formData.seoDescription.trim(),
      seoKeywords: formData.seoKeywords,
      schemaMarkup: formData.schemaMarkup.trim(),
      tags: formData.tags,
      isActive: formData.isActive,
    };
  };

  // ---- Save handlers ----
  const handleSave = async (publish = true) => {
    if (!validate()) {
      // Jump to tab with first error
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const firstError = errorKeys[0];
        if (['title', 'slug', 'price', 'developer', 'description'].includes(firstError)) setActiveTab(0);
        else if (firstError.startsWith('location')) setActiveTab(1);
      }
      setSnackbar({ open: true, message: 'Please fix the errors before saving', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      payload.isActive = publish ? formData.isActive : false;

      if (isEdit) {
        await propertyService.update(propertyId, payload);
        setSnackbar({ open: true, message: 'Property updated successfully', severity: 'success' });
      } else {
        await propertyService.create(payload);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setSnackbar({ open: true, message: 'Property created successfully', severity: 'success' });
      }

      setTimeout(() => navigate('/admin/properties'), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save property. Please try again.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Dynamic list helpers ----
  const addListItem = (field, defaultItem) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], defaultItem] }));
  };

  const removeListItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateListItem = (field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  // ---- Gallery drag-to-reorder ----
  const handleGalleryDragStart = (index) => setDragIndex(index);

  const handleGalleryDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setFormData((prev) => {
      const gallery = [...prev.gallery];
      const [moved] = gallery.splice(dragIndex, 1);
      gallery.splice(index, 0, moved);
      return { ...prev, gallery };
    });
    setDragIndex(index);
  };

  const handleGalleryDragEnd = () => setDragIndex(null);

  // ---- Amenity toggle ----
  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.find((a) => a.name === amenity.name);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter((a) => a.name !== amenity.name) };
      }
      return { ...prev, amenities: [...prev.amenities, amenity] };
    });
  };

  const isAmenitySelected = (name) => formData.amenities.some((a) => a.name === name);

  // ---- SEO Keywords ----
  const addSeoKeyword = (keyword) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !formData.seoKeywords.includes(trimmed)) {
      updateField('seoKeywords', [...formData.seoKeywords, trimmed]);
    }
    setSeoKeywordInput('');
  };

  const removeSeoKeyword = (keyword) => {
    updateField('seoKeywords', formData.seoKeywords.filter((k) => k !== keyword));
  };

  // ---- Tag toggle ----
  const toggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  // ---- Configuration toggle ----
  const toggleConfiguration = (config) => {
    setFormData((prev) => ({
      ...prev,
      configuration: prev.configuration.includes(config)
        ? prev.configuration.filter((c) => c !== config)
        : [...prev.configuration, config],
    }));
  };

  // ---- Schema validation ----
  const validateSchema = (value) => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  // ============ TAB CONTENT RENDERERS ============

  const renderBasicInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        label="Property Name"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        fullWidth
        required
      />
      <TextField
        label="Slug"
        value={formData.slug}
        onChange={(e) => {
          setSlugManuallyEdited(true);
          updateField('slug', e.target.value);
        }}
        error={!!errors.slug}
        helperText={errors.slug || 'Auto-generated from title. Edit to customize.'}
        fullWidth
        required
        InputProps={{
          startAdornment: <InputAdornment position="start">/properties/</InputAdornment>,
        }}
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: '#1B2A4A' }}>Type</FormLabel>
          <RadioGroup
            row
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
          >
            <FormControlLabel value="sale" control={<Radio />} label="Sale" />
            <FormControlLabel value="rent" control={<Radio />} label="Rent" />
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel sx={{ fontWeight: 600, mb: 1, color: '#1B2A4A' }}>Property Type</FormLabel>
          <RadioGroup
            row
            value={formData.propertyType}
            onChange={(e) => updateField('propertyType', e.target.value)}
          >
            <FormControlLabel value="apartment" control={<Radio />} label="Apartment" />
            <FormControlLabel value="villa" control={<Radio />} label="Villa" />
          </RadioGroup>
        </FormControl>
      </Box>

      <FormControl sx={{ maxWidth: 300 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={formData.status}
          label="Status"
          onChange={(e) => updateField('status', e.target.value)}
        >
          <MenuItem value="pre-launch">Pre-Launch</MenuItem>
          <MenuItem value="under-construction">Under Construction</MenuItem>
          <MenuItem value="ready-to-move">Ready to Move</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Price"
          type="number"
          value={formData.price}
          onChange={(e) => updateField('price', e.target.value)}
          error={!!errors.price}
          helperText={errors.price}
          required
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">&#8377;</InputAdornment>,
          }}
        />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Price Unit</InputLabel>
          <Select
            value={formData.priceUnit}
            label="Price Unit"
            onChange={(e) => updateField('priceUnit', e.target.value)}
          >
            <MenuItem value="onwards">Onwards</MenuItem>
            <MenuItem value="per month">Per Month</MenuItem>
            <MenuItem value="Cr">Cr</MenuItem>
            <MenuItem value="Lakhs">Lakhs</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TextField
        label="Developer Name"
        value={formData.developer}
        onChange={(e) => updateField('developer', e.target.value)}
        error={!!errors.developer}
        helperText={errors.developer}
        fullWidth
        required
      />

      <TextField
        label="Description"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        error={!!errors.description}
        helperText={errors.description || 'Supports plain text. Describe the property in detail.'}
        multiline
        rows={5}
        fullWidth
        required
      />

      {/* Highlights */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1 }}>
          Highlights
        </Typography>
        {formData.highlights.map((highlight, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={`Highlight ${index + 1}`}
              value={highlight}
              onChange={(e) => updateListItem('highlights', index, e.target.value)}
            />
            {formData.highlights.length > 1 && (
              <IconButton size="small" onClick={() => removeListItem('highlights', index)} sx={{ color: '#EF4444' }}>
                <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          size="small"
          variant="text"
          onClick={() => addListItem('highlights', '')}
          startIcon={<Icon icon="mdi:plus" />}
          sx={{ color: '#6B7280' }}
        >
          Add Highlight
        </Button>
      </Box>
    </Box>
  );

  const renderLocation = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        label="Area / Locality"
        value={formData.location.area}
        onChange={(e) => updateLocation('area', e.target.value)}
        error={!!errors['location.area']}
        helperText={errors['location.area']}
        fullWidth
        required
      />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="City"
          value={formData.location.city}
          onChange={(e) => updateLocation('city', e.target.value)}
          error={!!errors['location.city']}
          helperText={errors['location.city']}
          required
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="State"
          value={formData.location.state}
          onChange={(e) => updateLocation('state', e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>

      <TextField
        label="Full Address"
        value={formData.address}
        onChange={(e) => updateField('address', e.target.value)}
        multiline
        rows={2}
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Latitude"
          type="number"
          value={formData.location.lat}
          onChange={(e) => updateLocation('lat', e.target.value)}
          sx={{ flex: 1, minWidth: 180 }}
          inputProps={{ step: 'any' }}
        />
        <TextField
          label="Longitude"
          type="number"
          value={formData.location.lng}
          onChange={(e) => updateLocation('lng', e.target.value)}
          sx={{ flex: 1, minWidth: 180 }}
          inputProps={{ step: 'any' }}
        />
      </Box>

      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: '#F9FAFB',
          border: '2px dashed #E5E7EB',
          textAlign: 'center',
        }}
      >
        <Icon icon="mdi:map-outline" style={{ fontSize: 40, color: '#D1D5DB' }} />
        <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
          Map picker will be available in a future update
        </Typography>
      </Paper>
    </Box>
  );

  const renderConfiguration = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Configuration Options
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {CONFIGURATION_OPTIONS.map((config) => (
            <Chip
              key={config}
              label={config}
              clickable
              onClick={() => toggleConfiguration(config)}
              sx={{
                fontWeight: 500,
                bgcolor: formData.configuration.includes(config) ? '#1B2A4A' : '#F3F4F6',
                color: formData.configuration.includes(config) ? '#fff' : '#6B7280',
                '&:hover': {
                  bgcolor: formData.configuration.includes(config) ? '#2D4470' : '#E5E7EB',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Dimension Range
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Min Area"
            type="number"
            size="small"
            value={formData.dimensionRange.min}
            onChange={(e) => updateDimensionRange('min', e.target.value)}
            sx={{ width: 140 }}
          />
          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>to</Typography>
          <TextField
            label="Max Area"
            type="number"
            size="small"
            value={formData.dimensionRange.max}
            onChange={(e) => updateDimensionRange('max', e.target.value)}
            sx={{ width: 140 }}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Unit</InputLabel>
            <Select
              value={formData.dimensionRange.unit}
              label="Unit"
              onChange={(e) => updateDimensionRange('unit', e.target.value)}
            >
              <MenuItem value="sqft">sqft</MenuItem>
              <MenuItem value="sqm">sqm</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TextField
        label="Possession Date"
        value={formData.possession}
        onChange={(e) => updateField('possession', e.target.value)}
        fullWidth
        placeholder="e.g., Dec 2026 or Ready to Move"
      />
    </Box>
  );

  const renderSpecifications = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        Specifications (Key-Value Pairs)
      </Typography>
      <Typography variant="caption" sx={{ color: '#9CA3AF', mt: -1 }}>
        Common keys: Project Area, Total Units, Tower Count, Floor Count, RERA ID, Launch Date, etc.
      </Typography>

      {formData.specifications.map((spec, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Key"
            value={spec.key}
            onChange={(e) =>
              updateListItem('specifications', index, { ...spec, key: e.target.value })
            }
            sx={{ flex: 1 }}
            placeholder="e.g., projectArea"
          />
          <TextField
            size="small"
            label="Value"
            value={spec.value}
            onChange={(e) =>
              updateListItem('specifications', index, { ...spec, value: e.target.value })
            }
            sx={{ flex: 1 }}
            placeholder="e.g., 15 acres"
          />
          {formData.specifications.length > 1 && (
            <IconButton size="small" onClick={() => removeListItem('specifications', index)} sx={{ color: '#EF4444' }}>
              <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => addListItem('specifications', { key: '', value: '' })}
        startIcon={<Icon icon="mdi:plus" />}
        sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
      >
        Add Specification
      </Button>
    </Box>
  );

  const renderAmenities = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
          Amenities ({formData.amenities.length} selected)
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setCustomAmenityDialog(true)}
          startIcon={<Icon icon="mdi:plus" />}
          sx={{ borderRadius: 2 }}
        >
          Custom Amenity
        </Button>
      </Box>

      {Object.entries(AMENITY_CATEGORIES).map(([catKey, category]) => (
        <Paper key={catKey} sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Icon icon={category.icon} style={{ fontSize: 20, color: '#C9A86C' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
              {category.label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {category.items.map((amenity) => {
              const selected = isAmenitySelected(amenity.name);
              return (
                <Chip
                  key={amenity.name}
                  icon={<Icon icon={amenity.icon} style={{ fontSize: 16 }} />}
                  label={amenity.name}
                  clickable
                  onClick={() => toggleAmenity({ ...amenity, category: catKey })}
                  sx={{
                    fontWeight: 500,
                    bgcolor: selected ? '#1B2A4A' : '#F3F4F6',
                    color: selected ? '#fff' : '#6B7280',
                    '& .MuiChip-icon': { color: selected ? '#C9A86C' : '#9CA3AF' },
                    '&:hover': {
                      bgcolor: selected ? '#2D4470' : '#E5E7EB',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      ))}

      {/* Show custom amenities that are not in predefined list */}
      {formData.amenities.filter(
        (a) => !Object.values(AMENITY_CATEGORIES).some((cat) => cat.items.some((item) => item.name === a.name))
      ).length > 0 && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1 }}>
            Custom Amenities
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {formData.amenities
              .filter((a) => !Object.values(AMENITY_CATEGORIES).some((cat) => cat.items.some((item) => item.name === a.name)))
              .map((amenity) => (
                <Chip
                  key={amenity.name}
                  icon={<Icon icon={amenity.icon} style={{ fontSize: 16 }} />}
                  label={amenity.name}
                  onDelete={() => toggleAmenity(amenity)}
                  sx={{ fontWeight: 500, bgcolor: '#1B2A4A', color: '#fff', '& .MuiChip-icon': { color: '#C9A86C' }, '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.6)' } }}
                />
              ))}
          </Box>
        </Paper>
      )}
    </Box>
  );

  const renderFloorPlans = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        Floor Plans
      </Typography>

      {formData.floorPlans.map((fp, index) => (
        <Paper key={index} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280' }}>
              Floor Plan #{index + 1}
            </Typography>
            {formData.floorPlans.length > 1 && (
              <IconButton size="small" onClick={() => removeListItem('floorPlans', index)} sx={{ color: '#EF4444' }}>
                <Icon icon="mdi:close-circle-outline" style={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Configuration"
              value={fp.config}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, config: e.target.value })}
              sx={{ flex: '1 1 140px' }}
              placeholder="e.g., 2 BHK"
            />
            <TextField
              size="small"
              label="Area"
              value={fp.area}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, area: e.target.value })}
              sx={{ flex: '1 1 120px' }}
              placeholder="e.g., 1245 sqft"
            />
            <TextField
              size="small"
              label="Price"
              type="number"
              value={fp.price}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, price: e.target.value })}
              sx={{ flex: '1 1 140px' }}
              InputProps={{ startAdornment: <InputAdornment position="start">&#8377;</InputAdornment> }}
            />
            <TextField
              size="small"
              label="Bedrooms"
              type="number"
              value={fp.bedrooms}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, bedrooms: e.target.value })}
              sx={{ width: 100 }}
            />
            <TextField
              size="small"
              label="Bathrooms"
              type="number"
              value={fp.bathrooms}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, bathrooms: e.target.value })}
              sx={{ width: 100 }}
            />
            <TextField
              size="small"
              label="Image URL"
              value={fp.image}
              onChange={(e) => updateListItem('floorPlans', index, { ...fp, image: e.target.value })}
              sx={{ flex: '1 1 100%' }}
              placeholder="https://placehold.co/600x400"
            />
          </Box>
        </Paper>
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() =>
          addListItem('floorPlans', { config: '', area: '', price: '', image: '', bedrooms: '', bathrooms: '' })
        }
        startIcon={<Icon icon="mdi:plus" />}
        sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
      >
        Add Floor Plan
      </Button>
    </Box>
  );

  const renderGallery = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        Gallery Images (drag to reorder)
      </Typography>

      {formData.gallery.map((url, index) => (
        <Box
          key={index}
          draggable
          onDragStart={() => handleGalleryDragStart(index)}
          onDragOver={(e) => handleGalleryDragOver(e, index)}
          onDragEnd={handleGalleryDragEnd}
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            p: 1,
            borderRadius: 2,
            bgcolor: dragIndex === index ? '#EFF6FF' : 'transparent',
            border: dragIndex === index ? '1px dashed #3B82F6' : '1px solid transparent',
            cursor: 'grab',
            transition: 'background-color 0.15s',
          }}
        >
          <Icon icon="mdi:drag-vertical" style={{ fontSize: 20, color: '#D1D5DB', flexShrink: 0 }} />

          {/* Preview thumbnail */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.5,
              bgcolor: '#F3F4F6',
              backgroundImage: url ? `url(${url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!url && <Icon icon="mdi:image-outline" style={{ fontSize: 20, color: '#D1D5DB' }} />}
          </Box>

          <TextField
            size="small"
            fullWidth
            placeholder="Image URL"
            value={url}
            onChange={(e) => updateListItem('gallery', index, e.target.value)}
          />
          {formData.gallery.length > 1 && (
            <IconButton size="small" onClick={() => removeListItem('gallery', index)} sx={{ color: '#EF4444' }}>
              <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => addListItem('gallery', '')}
        startIcon={<Icon icon="mdi:plus" />}
        sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
      >
        Add Image
      </Button>
    </Box>
  );

  const renderNearbyPlaces = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        Nearby Places
      </Typography>

      {formData.nearbyPlaces.map((place, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Name"
            value={place.name}
            onChange={(e) =>
              updateListItem('nearbyPlaces', index, { ...place, name: e.target.value })
            }
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            size="small"
            label="Distance"
            value={place.distance}
            onChange={(e) =>
              updateListItem('nearbyPlaces', index, { ...place, distance: e.target.value })
            }
            sx={{ width: 120 }}
            placeholder="e.g., 3 km"
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={place.type}
              label="Type"
              onChange={(e) =>
                updateListItem('nearbyPlaces', index, { ...place, type: e.target.value })
              }
            >
              {NEARBY_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {formData.nearbyPlaces.length > 1 && (
            <IconButton size="small" onClick={() => removeListItem('nearbyPlaces', index)} sx={{ color: '#EF4444' }}>
              <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => addListItem('nearbyPlaces', { name: '', distance: '', type: 'school' })}
        startIcon={<Icon icon="mdi:plus" />}
        sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
      >
        Add Nearby Place
      </Button>
    </Box>
  );

  const renderSpecialitiesAndDocs = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Brochure & Floor Plan URLs */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Downloads
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Brochure URL"
            value={formData.brochureUrl}
            onChange={(e) => updateField('brochureUrl', e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            placeholder="https://example.com/brochure.pdf"
            size="small"
          />
          <TextField
            label="Floor Plan PDF URL"
            value={formData.floorPlanPdfUrl}
            onChange={(e) => updateField('floorPlanPdfUrl', e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            placeholder="https://example.com/floorplans.pdf"
            size="small"
          />
        </Box>
      </Box>

      {/* Specialities */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Property Specialities
        </Typography>
        {formData.specialities.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Icon"
              value={item.icon}
              onChange={(e) =>
                updateListItem('specialities', index, { ...item, icon: e.target.value })
              }
              sx={{ width: 160 }}
              placeholder="mdi:shield-star"
            />
            <TextField
              size="small"
              label="Name"
              value={item.name}
              onChange={(e) =>
                updateListItem('specialities', index, { ...item, name: e.target.value })
              }
              sx={{ flex: '1 1 140px' }}
              placeholder="e.g., RERA Approved"
            />
            <TextField
              size="small"
              label="Description"
              value={item.description}
              onChange={(e) =>
                updateListItem('specialities', index, { ...item, description: e.target.value })
              }
              sx={{ flex: '1 1 200px' }}
              placeholder="Short description"
            />
            {formData.specialities.length > 1 && (
              <IconButton size="small" onClick={() => removeListItem('specialities', index)} sx={{ color: '#EF4444' }}>
                <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          size="small"
          variant="text"
          onClick={() => addListItem('specialities', { icon: '', name: '', description: '' })}
          startIcon={<Icon icon="mdi:plus" />}
          sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
        >
          Add Speciality
        </Button>
      </Box>

      {/* Documents */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Property Documents
        </Typography>
        {formData.documents.map((doc, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
            <TextField
              size="small"
              label="Icon"
              value={doc.icon}
              onChange={(e) =>
                updateListItem('documents', index, { ...doc, icon: e.target.value })
              }
              sx={{ width: 180 }}
              placeholder="mdi:file-document"
            />
            <TextField
              size="small"
              label="Document Name"
              value={doc.name}
              onChange={(e) =>
                updateListItem('documents', index, { ...doc, name: e.target.value })
              }
              sx={{ flex: 1 }}
              placeholder="e.g., RERA Certificate"
            />
            {formData.documents.length > 1 && (
              <IconButton size="small" onClick={() => removeListItem('documents', index)} sx={{ color: '#EF4444' }}>
                <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          size="small"
          variant="text"
          onClick={() => addListItem('documents', { name: '', icon: 'mdi:file-document' })}
          startIcon={<Icon icon="mdi:plus" />}
          sx={{ color: '#6B7280', alignSelf: 'flex-start' }}
        >
          Add Document
        </Button>
      </Box>
    </Box>
  );

  const renderConstructionSpecs = () => {
    const updateConstructionSpec = (category, index, field, value) => {
      setFormData((prev) => {
        const specs = { ...prev.constructionSpecs };
        const catItems = [...(specs[category] || [])];
        catItems[index] = { ...catItems[index], [field]: value };
        specs[category] = catItems;
        return { ...prev, constructionSpecs: specs };
      });
    };

    const addConstructionSpec = (category) => {
      setFormData((prev) => {
        const specs = { ...prev.constructionSpecs };
        specs[category] = [...(specs[category] || []), { area: '', spec: '' }];
        return { ...prev, constructionSpecs: specs };
      });
    };

    const removeConstructionSpec = (category, index) => {
      setFormData((prev) => {
        const specs = { ...prev.constructionSpecs };
        specs[category] = specs[category].filter((_, i) => i !== index);
        return { ...prev, constructionSpecs: specs };
      });
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
          Construction Specifications
        </Typography>
        <Typography variant="caption" sx={{ color: '#9CA3AF', mt: -2 }}>
          Add detailed construction specs by category (Flooring, Doors, Structure, Electrical, etc.)
        </Typography>

        {CONSTRUCTION_SPEC_CATEGORIES.map((category) => {
          const items = formData.constructionSpecs[category] || [];
          if (items.length === 0 && !['flooring', 'doors', 'structure', 'electrical'].includes(category)) return null;
          return (
            <Paper key={category} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', textTransform: 'capitalize' }}>
                  {category}
                </Typography>
              </Box>
              {items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                  <TextField
                    size="small"
                    label="Area / Component"
                    value={item.area}
                    onChange={(e) => updateConstructionSpec(category, index, 'area', e.target.value)}
                    sx={{ flex: '1 1 150px' }}
                    placeholder="e.g., Living Room"
                  />
                  <TextField
                    size="small"
                    label="Specification"
                    value={item.spec}
                    onChange={(e) => updateConstructionSpec(category, index, 'spec', e.target.value)}
                    sx={{ flex: '2 1 250px' }}
                    placeholder="e.g., Italian marble flooring"
                  />
                  {items.length > 1 && (
                    <IconButton size="small" onClick={() => removeConstructionSpec(category, index)} sx={{ color: '#EF4444' }}>
                      <Icon icon="mdi:close-circle-outline" style={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                size="small"
                variant="text"
                onClick={() => addConstructionSpec(category)}
                startIcon={<Icon icon="mdi:plus" />}
                sx={{ color: '#6B7280' }}
              >
                Add {category} spec
              </Button>
            </Paper>
          );
        })}
      </Box>
    );
  };

  const renderSeoTags = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* SEO Section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A' }}>
        SEO Settings
      </Typography>

      <TextField
        label="SEO Title"
        value={formData.seoTitle}
        onChange={(e) => {
          if (e.target.value.length <= 60) updateField('seoTitle', e.target.value);
        }}
        fullWidth
        helperText={`${formData.seoTitle.length}/60 characters`}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography
                variant="caption"
                sx={{ color: formData.seoTitle.length > 55 ? '#EF4444' : '#9CA3AF' }}
              >
                {60 - formData.seoTitle.length}
              </Typography>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="SEO Description"
        value={formData.seoDescription}
        onChange={(e) => {
          if (e.target.value.length <= 160) updateField('seoDescription', e.target.value);
        }}
        multiline
        rows={3}
        fullWidth
        helperText={`${formData.seoDescription.length}/160 characters`}
      />

      {/* SEO Keywords */}
      <Box>
        <TextField
          label="SEO Keywords"
          size="small"
          value={seoKeywordInput}
          onChange={(e) => setSeoKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSeoKeyword(seoKeywordInput);
            }
          }}
          fullWidth
          placeholder="Type a keyword and press Enter"
          helperText="Press Enter to add a keyword"
        />
        {formData.seoKeywords.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {formData.seoKeywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                onDelete={() => removeSeoKeyword(kw)}
                sx={{ bgcolor: '#F3F4F6' }}
              />
            ))}
          </Box>
        )}
      </Box>

      <TextField
        label="Schema Markup (JSON-LD)"
        value={formData.schemaMarkup}
        onChange={(e) => updateField('schemaMarkup', e.target.value)}
        multiline
        rows={4}
        fullWidth
        error={formData.schemaMarkup && !validateSchema(formData.schemaMarkup)}
        helperText={
          formData.schemaMarkup && !validateSchema(formData.schemaMarkup)
            ? 'Invalid JSON format'
            : 'Paste valid JSON-LD schema markup'
        }
        InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8125rem' } }}
      />

      {/* Tags Section */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B2A4A', mb: 1.5 }}>
          Property Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {TAG_OPTIONS.map((tag) => {
            const selected = formData.tags.includes(tag.value);
            return (
              <Chip
                key={tag.value}
                label={tag.label}
                clickable
                onClick={() => toggleTag(tag.value)}
                sx={{
                  fontWeight: 600,
                  bgcolor: selected ? tag.bg : '#F3F4F6',
                  color: selected ? tag.color : '#9CA3AF',
                  border: selected ? `1px solid ${tag.color}` : '1px solid transparent',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );

  const tabRenderers = [
    renderBasicInfo,
    renderLocation,
    renderConfiguration,
    renderSpecifications,
    renderAmenities,
    renderFloorPlans,
    renderGallery,
    renderNearbyPlaces,
    renderSpecialitiesAndDocs,
    renderConstructionSpecs,
    renderSeoTags,
  ];

  // ============ RENDER ============

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#C9A86C' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/admin/properties')} sx={{ color: '#6B7280' }}>
            <Icon icon="mdi:arrow-left" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1B2A4A' }}>
              {isEdit ? 'Edit Property' : 'Add New Property'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {isEdit ? `Editing: ${formData.title || 'Untitled'}` : 'Fill in the details below to create a new property listing'}
            </Typography>
          </Box>
        </Box>

        {/* Action buttons (desktop) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/properties')}
              sx={{ borderRadius: 2, color: '#6B7280', borderColor: '#D1D5DB' }}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleSave(false)}
              disabled={saving}
              startIcon={<Icon icon="mdi:content-save-outline" />}
              sx={{ borderRadius: 2 }}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSave(true)}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Icon icon="mdi:check" />}
              sx={{ borderRadius: 2 }}
            >
              {isEdit ? 'Update' : 'Publish'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Tab navigation / Stepper */}
      {isMobile ? (
        /* === Mobile: Vertical Stepper with Accordions === */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {TAB_LABELS.map((tab, index) => (
            <Accordion
              key={index}
              expanded={activeTab === index}
              onChange={() => setActiveTab(activeTab === index ? -1 : index)}
              sx={{
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                border: activeTab === index ? '1px solid #C9A86C' : '1px solid #E5E7EB',
              }}
            >
              <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: activeTab === index ? '#1B2A4A' : '#F3F4F6',
                      color: activeTab === index ? '#fff' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon icon={tab.icon} style={{ fontSize: 18, color: activeTab === index ? '#C9A86C' : '#9CA3AF' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: activeTab === index ? '#1B2A4A' : '#6B7280' }}>
                      {tab.label}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {tabRenderers[index]()}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        /* === Desktop: Horizontal Tabs === */
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid #E5E7EB',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 56,
                color: '#6B7280',
                '&.Mui-selected': { color: '#1B2A4A', fontWeight: 600 },
              },
              '& .MuiTabs-indicator': { bgcolor: '#C9A86C', height: 3 },
            }}
          >
            {TAB_LABELS.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon icon={tab.icon} style={{ fontSize: 18 }} />
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabRenderers[activeTab]()}
          </Box>
        </Paper>
      )}

      {/* Mobile action buttons (sticky bottom) */}
      {isMobile && (
        <Paper
          sx={{
            position: 'sticky',
            bottom: 0,
            mt: 2,
            p: 2,
            borderRadius: 3,
            display: 'flex',
            gap: 1,
            zIndex: 10,
            boxShadow: '0px -4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/properties')}
            sx={{ borderRadius: 2, flex: 1, color: '#6B7280', borderColor: '#D1D5DB' }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSave(false)}
            disabled={saving}
            sx={{ borderRadius: 2, flex: 1 }}
          >
            Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSave(true)}
            disabled={saving}
            sx={{ borderRadius: 2, flex: 1 }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (isEdit ? 'Update' : 'Publish')}
          </Button>
        </Paper>
      )}

      {/* Custom Amenity Dialog */}
      <Dialog
        open={customAmenityDialog}
        onClose={() => setCustomAmenityDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1B2A4A' }}>Add Custom Amenity</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Amenity Name"
            value={customAmenity.name}
            onChange={(e) => setCustomAmenity((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Icon (Iconify format)"
            value={customAmenity.icon}
            onChange={(e) => setCustomAmenity((prev) => ({ ...prev, icon: e.target.value }))}
            fullWidth
            helperText="e.g., mdi:star-outline"
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={customAmenity.category}
              label="Category"
              onChange={(e) => setCustomAmenity((prev) => ({ ...prev, category: e.target.value }))}
            >
              {Object.entries(AMENITY_CATEGORIES).map(([key, cat]) => (
                <MenuItem key={key} value={key}>{cat.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCustomAmenityDialog(false)} sx={{ color: '#6B7280' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!customAmenity.name.trim()}
            onClick={() => {
              if (customAmenity.name.trim()) {
                toggleAmenity({
                  icon: customAmenity.icon,
                  name: customAmenity.name.trim(),
                  category: customAmenity.category,
                });
                setCustomAmenity({ name: '', icon: 'mdi:star-outline', category: 'convenience' });
                setCustomAmenityDialog(false);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertyForm;
