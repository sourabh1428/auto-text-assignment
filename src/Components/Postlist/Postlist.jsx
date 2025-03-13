import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Grid, CircularProgress, Paper, Typography, TextField, Pagination, Skeleton,
  Alert, Fab, Zoom, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Chip, Avatar, Badge, Divider, Menu, MenuItem,
  Snackbar, Switch, FormControlLabel, LinearProgress, useScrollTrigger
} from '@mui/material';
import {
  Search, Favorite, FavoriteBorder, Share, Sort, ArrowUpward,
  Delete, Edit, Close, Refresh, Add, Info, FilterList
} from '@mui/icons-material';
import axios from 'axios';
import { styled, useTheme } from '@mui/material/styles';
import { useDebounce } from 'use-debounce';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Custom styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8]
  },
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    transition: '0.3s'
  }
}));

const FloatingActions = styled('div')(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  zIndex: 1000
}));

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
};

export default function PostList() {
  const theme = useTheme();
  const [state, setState] = useState({
    posts: [],
    loading: true,
    error: '',
    searchQuery: '',
    currentPage: 1,
    postsPerPage: 12,
    sortBy: 'newest',
    selectedPost: null,
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    snackbarOpen: false,
    snackbarMessage: '',
    darkMode: false,
    anchorEl: null,
    deleteCandidate: null
  });

  const [debouncedSearch] = useDebounce(state.searchQuery, 300);
  const trigger = useScrollTrigger({ threshold: 100 });

  // Memoized data processing
  const { filteredPosts, pageCount, currentPosts } = useMemo(() => {
    const filtered = state.posts.filter(post => 
      post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      post.body.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      post.userId.toString() === debouncedSearch
    );

    const sorted = [...filtered].sort((a, b) => {
      if (state.sortBy === 'newest') return b.id - a.id;
      if (state.sortBy === 'oldest') return a.id - b.id;
      return a.title.localeCompare(b.title);
    });

    const indexOfLastPost = state.currentPage * state.postsPerPage;
    const indexOfFirstPost = indexOfLastPost - state.postsPerPage;
    
    return {
      filteredPosts: sorted,
      pageCount: Math.ceil(sorted.length / state.postsPerPage),
      currentPosts: sorted.slice(indexOfFirstPost, indexOfLastPost)
    };
  }, [state.posts, debouncedSearch, state.sortBy, state.currentPage, state.postsPerPage]);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, usersRes] = await Promise.all([
          axios.get('https://jsonplaceholder.typicode.com/posts'),
          axios.get('https://jsonplaceholder.typicode.com/users')
        ]);

        const postsWithUsers = postsRes.data.map(post => ({
          ...post,
          user: usersRes.data.find(user => user.id === post.userId),
          date: new Date(2023, post.id % 12, post.id % 28),
          tags: ['tech', 'business', 'health'].slice(post.id % 3)
        }));

        setState(s => ({ ...s, posts: postsWithUsers, loading: false }));
      } catch (err) {
        handleError(err);
        setState(s => ({ ...s, loading: false }));
      }
    };

    fetchData();
  }, []);

  // Handlers
  const handleError = (err) => {
    let errorMsg = 'Failed to fetch posts.';
    if (err.response) errorMsg = `Error: ${err.response.status} ${err.response.statusText}`;
    else if (err.request) errorMsg = 'Server is not responding';
    setState(s => ({ ...s, error: errorMsg }));
  };

  const toggleFavorite = (postId) => {
    const newFavorites = state.favorites.includes(postId)
      ? state.favorites.filter(id => id !== postId)
      : [...state.favorites, postId];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setState(s => ({
      ...s,
      favorites: newFavorites,
      snackbarOpen: true,
      snackbarMessage: state.favorites.includes(postId)
        ? 'Removed from favorites'
        : 'Added to favorites'
    }));
  };

  const handleDelete = (postId) => {
    setState(s => ({
      ...s,
      posts: s.posts.filter(post => post.id !== postId),
      snackbarOpen: true,
      snackbarMessage: 'Post deleted successfully',
      deleteCandidate: null
    }));
  };

  // UI Components
  const PostSkeleton = () => (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <StyledPaper>
        <Skeleton variant="rectangular" width="60%" height={32} />
        <Skeleton variant="text" width="100%" height={72} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="40%" />
        </div>
      </StyledPaper>
    </Grid>
  );

  return (
    <div style={{ 
      padding: 24, 
      minHeight: '100vh',
      backgroundColor: state.darkMode ? theme.palette.grey[900] : theme.palette.background.default
    }}>
      {/* Controls Section */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 32,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: 16,
        backgroundColor: state.darkMode ? theme.palette.grey[900] : '#ffffff',
        boxShadow: theme.shadows[2]
      }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search posts..."
          value={state.searchQuery}
          onChange={(e) => setState(s => ({ ...s, searchQuery: e.target.value, currentPage: 1 }))}
          InputProps={{
            startAdornment: <Search style={{ marginRight: 8 }} />
          }}
        />

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Tooltip title="Sort posts">
            <IconButton onClick={(e) => setState(s => ({ ...s, anchorEl: e.currentTarget }))}>
              <Sort />
            </IconButton>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                checked={state.darkMode}
                onChange={(e) => setState(s => ({ ...s, darkMode: e.target.checked }))}
              />
            }
            label="Dark Mode"
          />
        </div>

        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={() => setState(s => ({ ...s, anchorEl: null }))}
        >
          {['newest', 'oldest', 'alphabetical'].map((option) => (
            <MenuItem
              key={option}
              selected={state.sortBy === option}
              onClick={() => setState(s => ({ ...s, sortBy: option, anchorEl: null }))}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </MenuItem>
          ))}
        </Menu>
      </div>

      {/* Main Content */}
      {state.error && (
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {state.error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <AnimatePresence initial={false}>
          {state.loading ? (
            Array.from({ length: 8 }).map((_, i) => <PostSkeleton key={i} />)
          ) : filteredPosts.length === 0 ? (
            <Grid item xs={12}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Info style={{ fontSize: 64, marginBottom: 16 }} />
                <Typography variant="h5">No matching posts found</Typography>
                <Typography color="textSecondary">
                  Try adjusting your search terms or filters
                </Typography>
              </div>
            </Grid>
          ) : (
            currentPosts.map(post => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <StyledPaper>
                    <Badge
                      color="error"
                      overlap="circular"
                      badgeContent="New"
                      invisible={post.id > 10}
                      style={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <Avatar 
                        src={`https://i.pravatar.cc/40?u=${post.userId}`}
                        style={{ position: 'absolute', top: 8, left: 8 }}
                      />
                    </Badge>

                    <div style={{ marginLeft: 48 }}>
                      <Typography 
                        variant="subtitle2" 
                        color="textSecondary"
                      >
                        {post.user?.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                      >
                        {formatDistanceToNow(post.date)} ago
                      </Typography>
                    </div>

                    <Typography
                      variant="h6"
                      gutterBottom
                      style={{ 
                        marginTop: 16,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      color="textSecondary"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.body}
                    </Typography>

                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      {post.tags.map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Tooltip title={state.favorites.includes(post.id) ? 'Remove favorite' : 'Add favorite'}>
                        <IconButton onClick={() => toggleFavorite(post.id)}>
                          {state.favorites.includes(post.id) ? (
                            <Favorite color="error" />
                          ) : (
                            <FavoriteBorder />
                          )}
                        </IconButton>
                      </Tooltip>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <Tooltip title="Share">
                          <IconButton onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setState(s => ({ 
                              ...s, 
                              snackbarOpen: true,
                              snackbarMessage: 'Link copied to clipboard'
                            }));
                          }}>
                            <Share />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton onClick={() => setState(s => ({ ...s, deleteCandidate: post }))}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </StyledPaper>
                </motion.div>
              </Grid>
            ))
          )}
        </AnimatePresence>
      </Grid>

      {/* Pagination */}
      {!state.loading && filteredPosts.length > 0 && (
        <div style={{ margin: '32px 0', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pageCount}
            page={state.currentPage}
            onChange={(e, page) => setState(s => ({ ...s, currentPage: page }))}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            siblingCount={2}
            boundaryCount={2}
          />
        </div>
      )}

      {/* Floating Actions */}
      <Zoom in={trigger}>
        <FloatingActions>
          <Tooltip title="Scroll to top">
            <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowUpward />
            </Fab>
          </Tooltip>

          <Tooltip title="Create new post">
            <Fab color="secondary">
              <Add />
            </Fab>
          </Tooltip>
        </FloatingActions>
      </Zoom>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(state.deleteCandidate)}
        onClose={() => setState(s => ({ ...s, deleteCandidate: null }))}
      >
        <DialogTitle>Delete Post?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{state.deleteCandidate?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setState(s => ({ ...s, deleteCandidate: null }))}>
            Cancel
          </Button>
          <Button 
            color="error"
            onClick={() => handleDelete(state.deleteCandidate?.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={state.snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setState(s => ({ ...s, snackbarOpen: false }))}
        message={state.snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setState(s => ({ ...s, snackbarOpen: false }))}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
}