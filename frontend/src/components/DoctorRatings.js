import React, { useEffect, useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/utils/api';

const DoctorRatings = ({ doctorId }) => {
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await api.get(`/ratings/doctor/${doctorId}?sort=${sortBy}&limit=10`);
        setRatings(response.data.ratings);
        setSummary(response.data.summary);
      } catch (error) {
        // silently ignore failed rating loads — non-critical UI
      } finally {
        setLoading(false);
      }
    };
    fetchRatings();
  }, [doctorId, sortBy]);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) return <p>Loading ratings...</p>;

  return (
    <div className="space-y-6" data-testid="doctor-ratings">
      {/* Summary */}
      {summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  {summary.average_rating}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(summary.average_rating))}
                </div>
                <p className="text-sm text-slate-600">{summary.total_reviews} reviews</p>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-12">{star} star</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{
                          width: `${summary.total_reviews > 0 ? (summary[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`] / summary.total_reviews) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right">
                      {summary[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patient Reviews</CardTitle>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="highest">Highest</SelectItem>
              <SelectItem value="lowest">Lowest</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-4 last:border-0" data-testid={`review-${idx}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rating.patient_name}</span>
                      {rating.verified_patient && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-2">{renderStars(rating.rating)}</div>
                  {rating.review && (
                    <p className="text-sm text-slate-700">{rating.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorRatings;
