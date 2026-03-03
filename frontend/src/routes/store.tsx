import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Zap, 
  Star, 
  ArrowRight,
  Filter,
  Flame,
  LayoutGrid,
  PlayCircle
} from 'lucide-react'

export const Route = createFileRoute('/store')({
  component: StorePage,
})

const categories = [
  { name: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
  { name: 'Equipment', icon: <Zap className="w-4 h-4" /> },
  { name: 'Apparel', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'Calisthenics', icon: <Flame className="w-4 h-4" /> },
];

const products = [
  {
    id: 1,
    name: "XMF Pro Bo-Staff",
    price: "₹2,499",
    category: "Equipment",
    type: "Merch",
    description: "Competition grade lightweight staff.",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop",
    rating: 4.9,
    reviews: 124
  },
  {
    id: 2,
    name: "Elite Wood Rings",
    price: "₹3,999",
    category: "Calisthenics",
    type: "Affiliate",
    description: "Heavy duty birch wood rings.",
    image: "https://images.unsplash.com/photo-1590239068512-63274021200f?q=80&w=1000&auto=format&fit=crop",
    rating: 4.8,
    reviews: 89
  },
  {
    id: 3,
    name: "XMF Oversized Hoodie",
    price: "₹1,899",
    category: "Apparel",
    type: "Merch",
    description: "Premium heavyweight cotton.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop",
    rating: 5.0,
    reviews: 56
  },
  {
    id: 4,
    name: "Grip Master Gloves",
    price: "₹899",
    category: "Equipment",
    type: "Affiliate",
    description: "Superior grip for bar work.",
    image: "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?q=80&w=1000&auto=format&fit=crop",
    rating: 4.7,
    reviews: 210
  }
];

function StorePage() {
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Search & Header Section */}
      <section className="px-6 py-10 border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2">
              XMF <span className="text-primary">STORE</span>
            </h1>
            <p className="text-muted-foreground font-medium uppercase text-xs tracking-[0.2em]">Official Merch & Affiliate Gear</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search gear, merch, equipment..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-tight focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
        
        {/* Left Sidebar: Categories */}
        <aside className="lg:col-span-3 space-y-8">
          <div>
            <h3 className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-6 px-2">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border font-bold uppercase text-[11px] tracking-widest ${
                    activeCategory === cat.name 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-white/2 border-transparent hover:border-white/10 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    {cat.name}
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory === cat.name ? 'translate-x-1' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Vertical "Reels" Feature Promo */}
          <div className="rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-8 text-white relative overflow-hidden group cursor-pointer shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <PlayCircle className="w-10 h-10 mb-4" />
              <h4 className="text-xl font-black tracking-tight uppercase leading-tight mb-2">Watch XMF Gear in Action</h4>
              <p className="text-xs font-bold opacity-80 mb-6 uppercase tracking-wider">Vertical Reels & Demos</p>
              <button className="px-4 py-2 bg-white text-primary text-[10px] font-black rounded-lg uppercase">Watch Now</button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="lg:col-span-9 space-y-12">
          
          {/* Featured Banner (Zepto Style) */}
          <section className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/5">
            <img 
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1500&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60"
              alt="Promo"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black tracking-widest uppercase mb-4 w-fit">
                Limited Season Drop
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">Intensity <br /> Apparel</h2>
              <button className="flex items-center gap-2 text-white font-black text-xs tracking-widest uppercase hover:gap-4 transition-all w-fit">
                Explore Collection <ArrowRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          </section>

          {/* Product Grid */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase">Featured Gear</h3>
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] tracking-widest uppercase cursor-pointer">
                View All <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="glass-card group flex flex-col hover:border-primary/50 transition-all overflow-hidden border-white/5">
                  <div className="aspect-square relative overflow-hidden bg-white/2">
                    <img 
                      src={p.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                      alt={p.name}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black tracking-widest text-white uppercase">
                        {p.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-primary mb-2">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-black">{p.rating}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">({p.reviews})</span>
                    </div>
                    <h4 className="text-lg font-black tracking-tight uppercase mb-1 group-hover:text-primary transition-colors">{p.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium mb-6 line-clamp-1">{p.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between gap-4">
                      <div className="text-xl font-black text-foreground">{p.price}</div>
                      <button className="p-3 bg-primary text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Affiliate Recommendations (Bottom Banner) */}
          <section className="bg-white/2 border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-12 h-12 fill-current" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight uppercase mb-2">Decathlon X XMF</h3>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-lg">
                We've partnered with top gear providers to curate the exact equipment our gold medalists use. Verified for durability and performance.
              </p>
            </div>
            <button className="px-8 py-4 border border-white/10 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-white/5 transition-colors">
              Browse Partner Store
            </button>
          </section>

        </main>
      </div>
    </div>
  )
}
