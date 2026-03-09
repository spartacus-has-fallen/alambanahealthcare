import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const BlogPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs?published_only=true');
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-12" data-testid="blog-page">
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Health Blog</h1>
          <p className="text-slate-600 text-lg">Expert insights and health tips from our doctors</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No blog posts yet. Check back soon!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, idx) => (
              <Card key={blog.id} className="card-hover overflow-hidden" data-testid={`blog-card-${idx}`}>
                {blog.featured_image_base64 ? (
                  <img
                    src={blog.featured_image_base64}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary/40" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {blog.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-3 line-clamp-2">{blog.title}</h2>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {blog.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{blog.author?.name || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(blog.created_at)}</span>
                    </div>
                  </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {blog.tags.map((tag, tidx) => (
                        <span key={tidx} className="text-xs text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full gap-1 text-primary hover:text-primary/80"
                    onClick={() => navigate(`/blogs/${blog.id}`)}
                    data-testid={`read-more-${idx}`}
                  >
                    Read More <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
