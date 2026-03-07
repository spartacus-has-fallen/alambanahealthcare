import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await api.get(`/blogs/${blogId}`);
        setBlog(res.data);
      } catch (err) {
        navigate('/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [blogId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 max-w-3xl py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/blogs')}
          className="mb-8 gap-2 text-slate-600 hover:text-primary"
          data-testid="back-to-blogs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Button>

        <article>
          {blog.featured_image_base64 && (
            <img
              src={`data:image/jpeg;base64,${blog.featured_image_base64}`}
              alt={blog.title}
              className="w-full rounded-2xl mb-8 max-h-[400px] object-cover"
            />
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="capitalize">{blog.category}</Badge>
            {blog.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs gap-1">
                <Tag className="h-3 w-3" />{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}>
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
            {blog.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {blog.author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(blog.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="prose prose-slate max-w-none leading-relaxed text-slate-700 whitespace-pre-wrap">
            {blog.content}
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
