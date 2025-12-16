import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Star,
  MapPin,
  ShoppingCart,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner@2.0.3";

interface FavouriteService {
  id: string;
  title: string;
  professional: string;
  professionalAvatar: string;
  rating: number;
  reviewCount: number;
  price: string;
  location: string;
  category: string;
  image: string;
}

export default function FavouriteSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favourites, setFavourites] = useState<FavouriteService[]>([
    {
      id: "fav-1",
      title: "Professional Plumbing Services - Emergency & Repairs",
      professional: "John Smith",
      professionalAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      rating: 4.9,
      reviewCount: 127,
      price: "£45",
      location: "London, UK",
      category: "Home Services",
      image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=250&fit=crop",
    },
    {
      id: "fav-2",
      title: "Expert Electrical Installation & Maintenance",
      professional: "Sarah Johnson",
      professionalAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      rating: 5.0,
      reviewCount: 89,
      price: "£60",
      location: "Manchester, UK",
      category: "Home Services",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=250&fit=crop",
    },
  ]);

  const handleRemoveFavourite = (id: string) => {
    setFavourites(favourites.filter(fav => fav.id !== id));
    toast.success("Removed from favourites");
  };

  const handleViewService = (id: string) => {
    navigate(`/service/${id}`);
  };

  const handleAddToCart = (service: FavouriteService) => {
    toast.success(`${service.title.substring(0, 30)}... added to cart`);
  };

  // Filter favourites based on search
  const filteredFavourites = favourites.filter(fav =>
    fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fav.professional.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fav.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="font-['Roboto',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Favourites
          </h2>
          <p className="font-['Roboto',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
            Services you've saved for later
          </p>
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search favourites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full font-['Roboto',sans-serif] text-[13px]"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredFavourites.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="font-['Roboto',sans-serif] text-[16px] sm:text-[18px] text-[#2c353f] mb-2">
            {searchQuery ? "No matching favourites" : "No favourites yet"}
          </h3>
          <p className="font-['Roboto',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b] mb-4">
            {searchQuery 
              ? "Try searching with different keywords"
              : "Start exploring and save services you like"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => navigate("/services")}
              className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Roboto',sans-serif]"
            >
              Browse Services
            </Button>
          )}
        </div>
      )}

      {/* Favourites Grid */}
      {filteredFavourites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFavourites.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Service Image */}
              <div className="relative h-48 overflow-hidden group">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFavourite(service.id)}
                    className="bg-white/90 hover:bg-white text-red-600 rounded-full w-9 h-9 p-0"
                  >
                    <Heart className="w-5 h-5 fill-red-600" />
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-[#2c353f] hover:bg-white font-['Roboto',sans-serif] text-[11px]">
                    {service.category}
                  </Badge>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-4">
                {/* Professional */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={service.professionalAvatar} />
                    <AvatarFallback className="bg-[#3D78CB] text-white font-['Roboto',sans-serif] text-[11px]">
                      {service.professional.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                    {service.professional}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="font-['Roboto',sans-serif] text-[15px] text-[#2c353f] mb-2 line-clamp-2 cursor-pointer hover:text-[#3D78CB] transition-colors"
                  onClick={() => handleViewService(service.id)}
                >
                  {service.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-['Roboto',sans-serif] text-[13px] text-[#2c353f]">
                      {service.rating}
                    </span>
                  </div>
                  <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                    ({service.reviewCount} reviews)
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 mb-4">
                  <MapPin className="w-4 h-4 text-[#6b6b6b]" />
                  <span className="font-['Roboto',sans-serif] text-[13px] text-[#6b6b6b]">
                    {service.location}
                  </span>
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="font-['Roboto',sans-serif] text-[11px] text-[#6b6b6b] mb-1">
                      Starting at
                    </p>
                    <p className="font-['Roboto',sans-serif] text-[18px] text-[#FE8A0F]">
                      {service.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToCart(service)}
                      className="font-['Roboto',sans-serif] text-[12px] hover:text-[#3D78CB] hover:border-[#3D78CB]"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleViewService(service.id)}
                      className="bg-[#3D78CB] hover:bg-[#2d5ca3] text-white font-['Roboto',sans-serif] text-[12px]"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredFavourites.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="font-['Roboto',sans-serif] text-[14px] text-[#2c353f]">
            <Heart className="w-4 h-4 inline-block mr-2 text-red-600" />
            You have{" "}
            <span className="font-semibold">{filteredFavourites.length}</span>{" "}
            {filteredFavourites.length === 1 ? "service" : "services"} in your favourites
          </p>
        </div>
      )}
    </div>
  );
}