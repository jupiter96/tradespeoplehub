import { ChevronLeft, ChevronRight } from 'lucide-react';
import svgPaths from "../imports/svg-kbvia5rgdw";
import imgEllipse17 from "figma:asset/abf7759026040812d1be0192ad93cae51d649fa4.png";
import imgEllipse18 from "figma:asset/3c4f6d7cd8e52d1fbd106cc8702ba2e53af44c6f.png";
import imgEllipse16 from "figma:asset/2055816d9237a29b336d813b80b43778bb1a2fb9.png";
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import type { CarouselApi } from "./ui/carousel";
import { useEffect, useState } from 'react';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg className="w-[104px] h-[16px]" fill="none" preserveAspectRatio="none" viewBox="0 0 104 16">
        <path d={svgPaths.p1141f880} fill="#ED8A19" />
        <path d={svgPaths.p2b85b200} fill="#ED8A19" />
        <path d={svgPaths.p3bda6a00} fill="#ED8A19" />
        <path d={svgPaths.p859cf00} fill="#ED8A19" />
        <path d={svgPaths.p9ba3d60} fill={rating >= 5 ? "#ED8A19" : "#CDCDCD"} />
      </svg>
    </div>
  );
}

interface ReviewCardProps {
  name: string;
  title: string;
  review: string;
  rating: number;
  image: string;
}

function ReviewCard({ name, title, review, rating, image }: ReviewCardProps) {
  return (
    <div className="px-3">
      <div className="bg-white rounded-[10px] shadow-[0px_8px_20px_0px_rgba(61,120,203,0.1)] p-6 h-[320px] flex flex-col">
        {/* Header with Avatar and Rating */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-[55px] h-[55px] rounded-full overflow-hidden flex-shrink-0">
            <ImageWithFallback 
              src={image}
              alt={name}
              className="w-full h-full object-cover"
              width={55}
              height={55}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Stars rating={rating} />
              <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[20px] ml-2">{rating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Name and Title */}
        <div className="mb-4">
          <h3 className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[16px] mb-1">{name}</h3>
          <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px]">{title}</p>
        </div>

        {/* Review Text */}
        <p className="font-['Poppins',sans-serif] text-[#5b5b5b] text-[14px] leading-[1.6] flex-1">
          {review}
        </p>
      </div>
    </div>
  );
}

export default function PeopleLoveUsSection() {
  const [api, setApi] = useState<CarouselApi>();

  const reviews = [
    {
      name: "Janathan Dall",
      title: "Home Renovation",
      review: "Lorem ipsum dolor sit amet consectetur. Iaculis eget sed amet ut adipiscing nec nulla elit. Purus morbi neque fames elit feugiat.",
      rating: 4.9,
      image: imgEllipse17
    },
    {
      name: "Josef Flores",
      title: "Plumbing Services",
      review: "Lorem ipsum dolor sit amet consectetur. Iaculis eget sed amet ut adipiscing nec nulla elit. Purus morbi neque fames elit feugiat.",
      rating: 4.8,
      image: imgEllipse18
    },
    {
      name: "Maria Garcia",
      title: "Electrical Work",
      review: "Lorem ipsum dolor sit amet consectetur. Iaculis eget sed amet ut adipiscing nec nulla elit. Purus morbi neque fames elit feugiat.",
      rating: 4.8,
      image: imgEllipse16
    },
    {
      name: "Sarah Johnson",
      title: "Painting Services",
      review: "Outstanding service from start to finish. The professional was punctual, efficient, and delivered exceptional results. Highly recommend for anyone looking for quality work.",
      rating: 5.0,
      image: undefined
    },
    {
      name: "Michael Brown",
      title: "Carpentry Services",
      review: "Amazing craftsmanship and attention to detail. The professional was excellent and completed the job ahead of schedule. Will definitely use this service again.",
      rating: 4.9,
      image: undefined
    },
    {
      name: "Emma Wilson",
      title: "Landscaping",
      review: "Fantastic experience! The team transformed my garden beyond expectations. Professional, reliable, and affordable. I couldn't be happier with the results.",
      rating: 4.9,
      image: undefined
    }
  ];

  return (
    <section className="w-full bg-[#f0f0f0] py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Title */}
        <h2 className="font-['Poppins',sans-serif] text-[#2c353f] text-[24px] md:text-[28px] text-center mb-12">
          People Love Us
        </h2>

        {/* Carousel Container */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-3 md:basis-1/2 lg:basis-1/3">
                  <ReviewCard {...review} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => api?.scrollPrev()}
              className="w-[38px] h-[38px] rounded-full bg-[#FFF7EE] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-[#FE8A0F] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 group"
            >
              <ChevronLeft className="w-[17px] h-[12px] text-[#5b5b5b] group-hover:text-white transition-colors duration-300" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              className="w-[38px] h-[38px] rounded-full bg-[#FE8A0F] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300"
            >
              <ChevronRight className="w-[17px] h-[12px] text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
