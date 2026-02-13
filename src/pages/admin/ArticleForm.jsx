import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { articleService } from '../../services/api';

const categories = [
  { value: 'market-trends', label: 'Market Trends' },
  { value: 'buying-guide', label: 'Buying Guide' },
  { value: 'investment', label: 'Investment' },
  { value: 'legal', label: 'Legal' },
  { value: 'interior', label: 'Interior Design' },
];

const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const generateExcerpt = (content) => {
  if (!content) return '';
  // Strip markdown headings and get first paragraph
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  return lines[0]?.slice(0, 200) || '';
};

const emptyForm = {
  title: '',
  slug: '',
  category: 'market-trends',
  tags: [],
  image: '',
  content: '',
  excerpt: '',
  author: 'H.O.M Advisory Team',
  readTime: 5,
  seoTitle: '',
  seoDescription: '',
  isActive: false,
  publishedAt: new Date().toISOString(),
};

const GooglePreview = ({ title, description }) => (
  <Paper
    variant="outlined"
    sx={{ p: 2, borderRadius: 2, bgcolor: '#FAFAFA', border: '1px solid #E5E7EB' }}
  >
    <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF', mb: 0.5 }}>
      Google Search Preview
    </Typography>
    <Typography
      sx={{
        fontSize: '1.125rem',
        color: '#1a0dab',
        fontFamily: 'arial, sans-serif',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title || 'Article Title — H.O.M Advisory'}
    </Typography>
    <Typography sx={{ fontSize: '0.8125rem', color: '#006621', fontFamily: 'arial, sans-serif', mt: 0.25 }}>
      homadvisory.com/insights/articles/...
    </Typography>
    <Typography
      sx={{
        fontSize: '0.8125rem',
        color: '#545454',
        fontFamily: 'arial, sans-serif',
        mt: 0.25,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {description || 'Add an SEO description to control how this article appears in search results.'}
    </Typography>
  </Paper>
);

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchArticle = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await articleService.getById(id);
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        category: data.category || 'market-trends',
        tags: data.tags || [],
        image: data.image || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        author: data.author || 'H.O.M Advisory Team',
        readTime: data.readTime || 5,
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        isActive: data.isActive ?? false,
        publishedAt: data.publishedAt || new Date().toISOString(),
      });
      setSlugManuallyEdited(true);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load article', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const updateField = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === 'title' && !slugManuallyEdited) {
        updated.slug = generateSlug(value);
      }
      // Auto-generate excerpt from content
      if (field === 'content' && !prev.excerpt) {
        updated.excerpt = generateExcerpt(value);
      }
      return updated;
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) {
      setSnackbar({ open: true, message: 'Title is required', severity: 'error' });
      return;
    }
    if (!form.content.trim()) {
      setSnackbar({ open: true, message: 'Content is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || generateSlug(form.title),
        excerpt: form.excerpt || generateExcerpt(form.content),
        isActive: publish ? true : form.isActive,
        publishedAt: publish && !form.isActive ? new Date().toISOString() : form.publishedAt,
      };

      if (isEditing) {
        await articleService.update(id, payload);
        setSnackbar({ open: true, message: 'Article updated', severity: 'success' });
      } else {
        await articleService.create(payload);
        setSnackbar({ open: true, message: publish ? 'Article published' : 'Draft saved', severity: 'success' });
      }

      setTimeout(() => navigate('/admin/articles'), 1000);
    } catch {
      setSnackbar({ open: true, message: 'Failed to save article', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton height={40} width={300} sx={{ mb: 2 }} />
        <Skeleton height={56} sx={{ mb: 2 }} />
        <Skeleton height={56} sx={{ mb: 2 }} />
        <Skeleton height={200} sx={{ mb: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate('/admin/articles')}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            Back
          </Button>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>
            {isEditing ? 'Edit Article' : 'New Article'}
          </Typography>
        </Box>
      </Box>

      {/* Main Form */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #F3F4F6', mb: 3 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
          Article Details
        </Typography>

        {/* Title */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Title *
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter article title..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Slug */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Slug
            <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
              (auto-generated from title)
            </Typography>
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              updateField('slug', e.target.value);
            }}
            placeholder="article-url-slug"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Category & Author */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={form.category}
              label="Category"
              onChange={(e) => updateField('category', e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Author"
            value={form.author}
            onChange={(e) => updateField('author', e.target.value)}
            sx={{ flex: 1, minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Tags */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="outlined"
              onClick={handleAddTag}
              sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#D1D5DB', color: '#374151' }}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {form.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => handleRemoveTag(tag)}
                sx={{ fontSize: '0.75rem', bgcolor: '#F3F4F6' }}
              />
            ))}
          </Box>
        </Box>

        {/* Featured Image */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Featured Image URL
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={form.image}
            onChange={(e) => updateField('image', e.target.value)}
            placeholder="https://example.com/image.jpg"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Content */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Content * <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>(Markdown supported)</Typography>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={16}
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Write your article content here... Markdown is supported."
            InputProps={{
              sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Excerpt */}
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            Excerpt
            <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
              (auto-generated from first paragraph, editable)
            </Typography>
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            value={form.excerpt}
            onChange={(e) => updateField('excerpt', e.target.value)}
            placeholder="Brief summary of the article..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </Paper>

      {/* SEO Section */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #F3F4F6', mb: 3 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2A4A', mb: 2 }}>
          SEO Settings
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <GooglePreview title={form.seoTitle || form.title} description={form.seoDescription || form.excerpt} />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            SEO Title
            <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
              {(form.seoTitle || '').length}/70
            </Typography>
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={form.seoTitle}
            onChange={(e) => updateField('seoTitle', e.target.value)}
            placeholder={form.title || 'SEO title...'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
            SEO Description
            <Typography component="span" sx={{ fontSize: '0.6875rem', color: '#9CA3AF', ml: 1 }}>
              {(form.seoDescription || '').length}/160
            </Typography>
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            value={form.seoDescription}
            onChange={(e) => updateField('seoDescription', e.target.value)}
            placeholder={form.excerpt || 'SEO description...'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #F3F4F6' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            onClick={() => navigate('/admin/articles')}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSave(false)}
            disabled={saving}
            startIcon={<Icon icon="mdi:content-save-outline" />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#D1D5DB',
              color: '#374151',
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSave(true)}
            disabled={saving}
            startIcon={<Icon icon="mdi:publish" />}
            sx={{
              textTransform: 'none',
              bgcolor: '#1B2A4A',
              borderRadius: 2,
              px: 4,
              '&:hover': { bgcolor: '#2d3f63' },
            }}
          >
            {saving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish'}
          </Button>
        </Box>
      </Paper>

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

export default ArticleForm;
