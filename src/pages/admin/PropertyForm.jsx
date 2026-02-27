import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { propertyService } from '../../services/api';
import { TAB_CONFIG, DRAFT_STORAGE_KEY, generateSlug, getDefaultFormData, getDefaultSections } from './property-tabs/constants';
import {
  GalleryTab,
  BasicInfoTab,
  OverviewTab,
  DetailsTab,
  HighlightsTab,
  AmenitiesTab,
  FloorPlansTab,
  NearbyPlacesTab,
  DocumentsTab,
  ConstructionSpecsTab,
  ConstructionStatusTab,
  DeveloperTab,
  FaqsTab,
  SimilarPropertiesTab,
  SeoTagsTab,
  SectionVisibilityTab,
} from './property-tabs';

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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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

        // Map specifications: support both object and array formats
        let specs;
        if (Array.isArray(property.specifications)) {
          specs = property.specifications.length ? property.specifications : [{ key: '', value: '', icon: '' }];
        } else if (property.specifications && typeof property.specifications === 'object') {
          specs = Object.entries(property.specifications).map(([key, value]) => ({
            key,
            value: String(value),
            icon: '',
          }));
          if (specs.length === 0) specs = [{ key: '', value: '', icon: '' }];
        } else {
          specs = [{ key: '', value: '', icon: '' }];
        }

        setFormData({
          title: property.title || '',
          slug: property.slug || '',
          type: property.type || 'sale',
          propertyType: property.propertyType || 'apartment',
          category: property.category || property.propertyType || 'apartment',
          status: property.status || 'pre-launch',
          sections: { ...getDefaultSections(), ...(property.sections || {}) },
          publishStatus: property.publishStatus || (property.isActive ? 'published' : 'draft'),
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
            address: property.location?.address || property.address || '',
          },
          configuration: property.configuration || [],
          dimensionRange: {
            min: property.dimensionRange?.min || '',
            max: property.dimensionRange?.max || '',
            unit: property.dimensionRange?.unit || 'sqft',
          },
          possession: property.possession || '',
          specifications: specs,
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
            ? property.documents.map((d) => ({ ...d, url: d.url || '' }))
            : [{ name: '', icon: 'mdi:file-document', url: '' }],
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
            ...(property.constructionSpecs?.plumbing?.length
              ? { plumbing: property.constructionSpecs.plumbing }
              : {}),
            ...(property.constructionSpecs?.others?.length
              ? { others: property.constructionSpecs.others }
              : {}),
          },
          constructionTimeline: property.constructionTimeline?.length
            ? property.constructionTimeline
            : [
                { label: 'Foundation', status: 'pending', icon: 'mdi:shovel' },
                { label: 'Structure', status: 'pending', icon: 'mdi:crane' },
                { label: 'Finishing', status: 'pending', icon: 'mdi:format-paint' },
                { label: 'Handover', status: 'pending', icon: 'mdi:key-variant' },
              ],
          developerInfo: property.developerInfo || {
            name: property.developer || '',
            description: '',
            logo: '',
            stats: [
              { value: '', suffix: '+', label: 'Years Experience', icon: 'mdi:calendar-star' },
              { value: '', suffix: '+', label: 'Projects Completed', icon: 'mdi:office-building' },
            ],
          },
          faqs: property.faqs?.length
            ? property.faqs
            : [{ question: '', answer: '' }],
          similarPropertyIds: property.similarPropertyIds || [],
          seoTitle: property.seoTitle || '',
          seoDescription: property.seoDescription || '',
          seoKeywords: property.seoKeywords || [],
          ogTitle: property.ogTitle || '',
          ogDescription: property.ogDescription || '',
          ogImage: property.ogImage || '',
          twitterCard: property.twitterCard || 'summary_large_image',
          canonicalUrl: property.canonicalUrl || '',
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
        setFormData((prev) => ({ ...prev, ...parsed }));
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

  const addListItem = useCallback((field, defaultItem) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], defaultItem] }));
  }, []);

  const removeListItem = useCallback((field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }, []);

  const updateListItem = useCallback((field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
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

    // Navigate to the tab containing the first error
    const errorKeys = Object.keys(errs);
    if (errorKeys.length > 0) {
      const firstError = errorKeys[0];
      if (['title', 'slug', 'price', 'developer'].includes(firstError)) setActiveTab(1);
      else if (firstError === 'description' || firstError.startsWith('location')) setActiveTab(2);
    }

    return Object.keys(errs).length === 0;
  };

  // ---- Build API payload ----
  const buildPayload = () => {
    // Convert specifications array to object for backward compatibility
    const specsObj = {};
    formData.specifications.forEach((s) => {
      if (s.key.trim()) {
        const val = isNaN(Number(s.value)) ? s.value : Number(s.value);
        specsObj[s.key.trim()] = val;
      }
    });

    // Filter empty FAQs
    const validFaqs = formData.faqs.filter((f) => f.question.trim() && f.answer.trim());

    // Filter developer stats
    const devStats = (formData.developerInfo?.stats || []).filter(
      (s) => s.value && s.label.trim()
    ).map((s) => ({ ...s, value: Number(s.value) || 0 }));

    return {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      type: formData.type,
      propertyType: formData.propertyType,
      category: formData.category || formData.propertyType,
      status: formData.status,
      sections: formData.sections || getDefaultSections(),
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
        address: formData.location.address?.trim() || '',
      },
      configuration: formData.configuration,
      dimensionRange: {
        min: formData.dimensionRange.min ? Number(formData.dimensionRange.min) : null,
        max: formData.dimensionRange.max ? Number(formData.dimensionRange.max) : null,
        unit: formData.dimensionRange.unit,
      },
      possession: formData.possession,
      specifications: specsObj,
      specificationsArray: formData.specifications.filter((s) => s.key.trim()),
      amenities: formData.amenities,
      floorPlans: formData.floorPlans.filter((fp) => fp.config.trim()),
      gallery: formData.gallery.filter((g) => g.trim()),
      nearbyPlaces: formData.nearbyPlaces.filter((np) => np.name.trim()),
      brochureUrl: formData.brochureUrl?.trim() || '',
      floorPlanPdfUrl: formData.floorPlanPdfUrl?.trim() || '',
      specialities: formData.specialities.filter((s) => s.name.trim()),
      documents: formData.documents.filter((d) => d.name.trim()),
      constructionSpecs: Object.fromEntries(
        Object.entries(formData.constructionSpecs)
          .filter(
            ([, items]) => Array.isArray(items) && items.some((item) => item.area.trim() && item.spec.trim())
          )
          .map(([key, items]) => [key, items.filter((item) => item.area.trim() && item.spec.trim())])
      ),
      constructionTimeline: formData.constructionTimeline.filter((t) => t.label.trim()),
      developerInfo: {
        name: formData.developerInfo?.name || formData.developer.trim(),
        description: formData.developerInfo?.description?.trim() || '',
        logo: formData.developerInfo?.logo?.trim() || '',
        stats: devStats,
      },
      faqs: validFaqs,
      similarPropertyIds: formData.similarPropertyIds,
      seoTitle: formData.seoTitle.trim(),
      seoDescription: formData.seoDescription.trim(),
      seoKeywords: formData.seoKeywords,
      ogTitle: formData.ogTitle?.trim() || '',
      ogDescription: formData.ogDescription?.trim() || '',
      ogImage: formData.ogImage?.trim() || '',
      twitterCard: formData.twitterCard || 'summary_large_image',
      canonicalUrl: formData.canonicalUrl?.trim() || '',
      schemaMarkup: formData.schemaMarkup.trim(),
      tags: formData.tags,
      isActive: formData.isActive,
    };
  };

  // ---- Save handlers ----
  const handleSave = async (publish = true) => {
    if (!validate()) {
      setSnackbar({ open: true, message: 'Please fix the errors before saving', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      payload.publishStatus = publish ? 'published' : 'draft';
      payload.isActive = publish;

      if (isEdit) {
        await propertyService.update(propertyId, payload);
        setSnackbar({ open: true, message: 'Property updated successfully', severity: 'success' });
      } else {
        await propertyService.create(payload);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setSnackbar({ open: true, message: publish ? 'Property published successfully' : 'Property saved as draft', severity: 'success' });
      }

      setTimeout(() => navigate('/admin/properties'), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save property. Please try again.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Tab renderers ----
  const sharedProps = {
    formData,
    updateField,
    updateListItem,
    addListItem,
    removeListItem,
    errors,
  };

  const tabRenderers = [
    () => <GalleryTab {...sharedProps} />,
    () => <BasicInfoTab {...sharedProps} slugManuallyEdited={slugManuallyEdited} setSlugManuallyEdited={setSlugManuallyEdited} />,
    () => <OverviewTab {...sharedProps} />,
    () => <DetailsTab {...sharedProps} />,
    () => <HighlightsTab {...sharedProps} />,
    () => <AmenitiesTab {...sharedProps} />,
    () => <FloorPlansTab {...sharedProps} />,
    () => <NearbyPlacesTab {...sharedProps} />,
    () => <DocumentsTab {...sharedProps} />,
    () => <ConstructionSpecsTab {...sharedProps} />,
    () => <ConstructionStatusTab {...sharedProps} />,
    () => <DeveloperTab {...sharedProps} />,
    () => <FaqsTab {...sharedProps} />,
    () => <SimilarPropertiesTab {...sharedProps} propertyId={propertyId} />,
    () => <SectionVisibilityTab {...sharedProps} />,
    () => <SeoTagsTab {...sharedProps} />,
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#C9A86C' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
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
              {isEdit ? 'Update & Publish' : 'Publish'}
            </Button>
          </Box>
        )}
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {TAB_CONFIG.map((tab, index) => (
            <Accordion
              key={tab.key}
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
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: activeTab === index ? '#1B2A4A' : '#F3F4F6',
                      color: activeTab === index ? '#fff' : '#6B7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 600,
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
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', maxWidth: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: '1px solid #E5E7EB',
              maxWidth: '100%',
              '& .MuiTab-root': {
                textTransform: 'none', fontWeight: 500, minHeight: 56,
                color: '#6B7280',
                fontSize: { xs: '0.7rem', md: '0.775rem', lg: '0.825rem' },
                minWidth: { xs: 'auto', md: 80 },
                px: { xs: 0.75, md: 1.5 },
                '&.Mui-selected': { color: '#1B2A4A', fontWeight: 600 },
              },
              '& .MuiTabs-indicator': { bgcolor: '#C9A86C', height: 3 },
              '& .MuiTabs-scrollButtons': { '&.Mui-disabled': { opacity: 0.3 } },
            }}
          >
            {TAB_CONFIG.map((tab) => (
              <Tab
                key={tab.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon={tab.icon} style={{ fontSize: 16 }} />
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
          <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, overflow: 'hidden' }}>
            {tabRenderers[activeTab]()}
          </Box>
        </Paper>
      )}

      {isMobile && (
        <Paper
          sx={{
            position: 'sticky', bottom: 0, mt: 2, p: 2, borderRadius: 3,
            display: 'flex', gap: 1, zIndex: 10,
            boxShadow: '0px -4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Button variant="outlined" onClick={() => navigate('/admin/properties')}
            sx={{ borderRadius: 2, flex: 1, color: '#6B7280', borderColor: '#D1D5DB' }}>
            Cancel
          </Button>
          <Button variant="outlined" onClick={() => handleSave(false)} disabled={saving}
            sx={{ borderRadius: 2, flex: 1 }}>
            Draft
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleSave(true)} disabled={saving}
            sx={{ borderRadius: 2, flex: 1 }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (isEdit ? 'Update' : 'Publish')}
          </Button>
        </Paper>
      )}

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
