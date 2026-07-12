import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'David Chen',
    role: 'Senior Software Engineer',
    content: 'Hakan is a meticulous developer. His ability to write clean, scalable code and his dedication to optimizing both software and hardware architectures make him an invaluable asset to any technical team.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    role: 'QA Automation Lead',
    content: 'Working alongside Hakan has been a great experience. He has a deep understanding of test automation pipelines and always ensures that deployments are flawless and bug-free.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 3,
    name: 'Michael Rodriguez',
    role: 'IT Infrastructure Manager',
    content: 'Hakan brings a unique blend of software development skills and deep hardware knowledge. Whether configuring a high-performance PC or deploying an app, his problem-solving skills are top-notch.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    id: 4,
    name: 'Emily Thompson',
    role: 'Product Manager',
    content: 'His background in education truly shows in his communication. Hakan has a talent for explaining complex technical challenges simply and clearly, bridging the gap between developers and stakeholders.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  }
];

const Testimonials = () => {
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 768) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < testimonials.length - itemsPerPage;

  const scroll = (direction) => {
    let newIndex = currentIndex;
    if (direction === 'left' && canScrollLeft) {
      newIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'right' && canScrollRight) {
      newIndex = Math.min(testimonials.length - itemsPerPage, currentIndex + 1);
    }

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      if (scrollContainerRef.current) {
        const card = scrollContainerRef.current.children[newIndex];
        if(card) {
          scrollContainerRef.current.scrollTo({
            left: card.offsetLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <section id="testimonials" className="py-24 overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container mx-auto px-6">
        
        {/* ÜST BAŞLIK BÖLÜMÜ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase max-w-2xl">
            Colleagues who know how I <span className="text-accent-purple">write code</span>
          </h2>
          
          {/* MASAÜSTÜ OK BUTONLARI */}
          <div className="hidden md:flex gap-4 shrink-0">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--color-card-bg)' }}
              aria-label="Scroll left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--color-card-bg)' }}
              aria-label="Scroll right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* YORUM KARTLARI BÖLÜMÜ */}
        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap gap-8 pb-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-shrink-0 w-full md:w-[calc(50%-16px)] snap-start"
            >
              <div className="p-8 rounded-2xl h-full flex flex-col border border-white/10" style={{ backgroundColor: 'var(--color-card-bg)' }}>
                <div className="flex items-center mb-6">
                  <img className="w-12 h-12 rounded-full mr-4 object-cover" alt={testimonial.name} src={testimonial.avatar} />
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-sm text-accent-purple">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* MOBİL OK BUTONLARI */}
        <div className="mt-8 flex justify-end md:hidden">
          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-card-bg)' }}
              aria-label="Scroll left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-card-bg)' }}
              aria-label="Scroll right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Testimonials;