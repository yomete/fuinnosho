// 100-day film photography challenge data parsed from the workbook
// Complete version with all 100 prompts

export const challenge100Days = {
  name: "Last 100 Days of 2025: Film Photography Challenge",
  description: "A DIY workbook with 100 daily prompts for intentional analog photography",
  start_date: "2025-09-11",
  end_date: "2025-12-19", 
  total_days: 100,
  phases: [
    { name: "Foundation Building", days: "1-10", period: "Sep 11-20" },
    { name: "Corfu Offsite, Greece", days: "11-17", period: "Sep 21-27" },
    { name: "Post-Corfu Integration", days: "18-21", period: "Sep 28 - Oct 1" },
    { name: "Montenegro Wedding", days: "22-24", period: "Oct 2-4" },
    { name: "Post-Wedding Reflection", days: "25-28", period: "Oct 5-8" },
    { name: "Cinematic Experiments Week", days: "29-35", period: "Oct 9-15" },
    { name: "First HP5 Week", days: "36-42", period: "Oct 16-22" },
    { name: "Malta Offsite", days: "43-45", period: "Oct 23-26" },
    { name: "Malta Integration", days: "46-50", period: "Oct 27-31" },
    { name: "Japan Honeymoon", days: "51-71", period: "Oct 31 - Nov 20" },
    { name: "Japan Integration Week", days: "72-78", period: "Nov 21-27" },
    { name: "Documentary Project Week", days: "79-85", period: "Nov 28 - Dec 4" },
    { name: "Experimental Week", days: "86-92", period: "Dec 5-11" },
    { name: "Final Portfolio Week", days: "93-100", period: "Dec 12-19" }
  ],
  prompts: [
    // Days 1-10: Foundation Building (Sep 11-20)
    {
      day_number: 1,
      title: "First Frame Ritual",
      prompt_text: "Take your first exposure of this challenge. Photograph something that represents your current photographic mindset. What do you want to achieve in these 100 days?",
      film_suggestion: "Load Portra 160",
      frame_range: "Frame 1",
      phase: "Foundation Building"
    },
    {
      day_number: 2,
      title: "Golden Hour Hunt",
      prompt_text: "Capture the golden hour in color. Study how Portra 160 renders warm light and skin tones.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 2-3",
      phase: "Foundation Building"
    },
    {
      day_number: 3,
      title: "Rule of Thirds Rebellion",
      prompt_text: "Deliberately break the rule of thirds. Center your subject, use extreme compositions. What stories emerge from unconventional framing?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 4-5",
      phase: "Foundation Building"
    },
    {
      day_number: 4,
      title: "Color Temperature Study",
      prompt_text: "Photograph the same subject in different light sources. Window light vs. tungsten vs. daylight. How does Portra handle mixed lighting?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 6-8",
      phase: "Foundation Building"
    },
    {
      day_number: 5,
      title: "Portrait Practice",
      prompt_text: "Portra's designed for portraits. Practice with available light, focus on skin tone rendering.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 9-11",
      phase: "Foundation Building"
    },
    {
      day_number: 6,
      title: "Street Level",
      prompt_text: "Get low. Photograph from knee-height or ground level. How does this perspective change familiar scenes?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 12-15",
      phase: "Foundation Building"
    },
    {
      day_number: 7,
      title: "Overcast Color",
      prompt_text: "Portra shines in overcast conditions. Explore how it handles muted, soft light.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 16-18",
      phase: "Foundation Building"
    },
    {
      day_number: 8,
      title: "Bulk Loading Preparation Day",
      prompt_text: "While shooting these frames, research bulk loading tutorials. Order film changing bag if needed. Plan your HP5 bulk loading setup.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 19-22",
      special_notes: "Research bulk loading tutorials",
      phase: "Foundation Building"
    },
    {
      day_number: 9,
      title: "Motion and Color",
      prompt_text: "Experiment with motion blur in color. How does color affect the perception of movement?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 23-26",
      phase: "Foundation Building"
    },
    {
      day_number: 10,
      title: "Detail Hunt",
      prompt_text: "Focus on small details others miss. How does Portra's fine grain help with detailed work?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 27-30",
      phase: "Foundation Building"
    },

    // Days 11-17: Corfu Offsite, Greece (Sep 21-27)
    {
      day_number: 11,
      title: "Arrival Energy",
      prompt_text: "Capture the energy of arrival. First impressions, travel fatigue, excitement. How does a new place feel in those first hours?",
      film_suggestion: "Load Portra 160",
      frame_range: "Frame 1",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece",
      special_notes: "Using reserved Corfu films"
    },
    {
      day_number: 12,
      title: "Mediterranean Light",
      prompt_text: "Study how Greek light differs from home. How does Portra 160 handle this intense, clear light?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 2-5",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },
    {
      day_number: 13,
      title: "Local Life Integration",
      prompt_text: "Photograph how locals live, not tourist attractions. Markets, daily routines, authentic moments.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 6-9",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },
    {
      day_number: 14,
      title: "Color Temperature Studies",
      prompt_text: "Compare how different color films render the same Mediterranean light. Shoot similar subjects as yesterday.",
      film_suggestion: "Switch to Santa Color 100",
      frame_range: "New roll",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },
    {
      day_number: 15,
      title: "Architectural Details",
      prompt_text: "Use the finest grain film for architectural details. Ancient vs. modern, decay vs. preservation.",
      film_suggestion: "Load Adox HR 50",
      frame_range: "New roll",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },
    {
      day_number: 16,
      title: "Group Dynamics",
      prompt_text: "Photograph your colleagues/group. How do people interact differently when traveling?",
      film_suggestion: "Load Dealer's V3 250D",
      frame_range: "New roll",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },
    {
      day_number: 17,
      title: "Departure Melancholy",
      prompt_text: "Capture the bittersweet moment of leaving. Last meals, packed bags, goodbyes.",
      film_suggestion: "Portra 800 - evening/indoor",
      frame_range: "New roll",
      location_context: "Corfu",
      phase: "Corfu Offsite, Greece"
    },

    // Days 18-21: Post-Corfu Integration (Sep 28 - Oct 1)
    {
      day_number: 18,
      title: "Home Through Travel Eyes",
      prompt_text: "Finish this roll photographing familiar places with fresh perspective. How has travel changed your vision?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 31-34",
      phase: "Post-Corfu Integration"
    },
    {
      day_number: 19,
      title: "First Black & White Roll",
      prompt_text: "Start your first B&W roll of the challenge. Compare how removing color changes your seeing.",
      film_suggestion: "Load Kentmere Pan 100",
      frame_range: "New roll",
      phase: "Post-Corfu Integration"
    },
    {
      day_number: 20,
      title: "B&W Fundamentals",
      prompt_text: "Learn B&W basics with affordable film. Study contrast, tonal range, grain structure.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 2-5",
      phase: "Post-Corfu Integration"
    },
    {
      day_number: 21,
      title: "Travel vs. Home Contrast",
      prompt_text: "Use B&W to show contrast between travel memories and daily reality.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 6-9",
      phase: "Post-Corfu Integration"
    },

    // Days 22-24: Montenegro Wedding (Oct 2-4)
    {
      day_number: 22,
      title: "Pre-Wedding Anticipation",
      prompt_text: "Capture the nervous energy before the ceremony. Getting ready, final preparations, quiet moments.",
      film_suggestion: "Load Portra 800",
      frame_range: "New roll",
      location_context: "Montenegro",
      phase: "Montenegro Wedding",
      special_notes: "Using reserved Montenegro films"
    },
    {
      day_number: 23,
      title: "Ceremony Emotion",
      prompt_text: "Focus on emotion over action. Tears, smiles, nervous gestures. Use HR 50 for intimate B&W moments.",
      film_suggestion: "Continue Portra 800 + Load Adox HR 50",
      frame_range: "Continue + new roll",
      location_context: "Montenegro",
      phase: "Montenegro Wedding"
    },
    {
      day_number: 24,
      title: "Celebration Joy",
      prompt_text: "Evening celebration with cinematic stock. How does tungsten-balanced film handle party lighting?",
      film_suggestion: "Load Safelight 500T",
      frame_range: "New roll",
      location_context: "Montenegro",
      phase: "Montenegro Wedding"
    },

    // Days 25-28: Post-Wedding Reflection (Oct 5-8)
    {
      day_number: 25,
      title: "Love in Daily Life",
      prompt_text: "After photographing a wedding, find love in everyday moments. Couples on the street, family interactions.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 10-14",
      phase: "Post-Wedding Reflection"
    },
    {
      day_number: 26,
      title: "Portrait Practice",
      prompt_text: "Practice portraits with the same intention you brought to the wedding. Study B&W portrait techniques.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 15-19",
      phase: "Post-Wedding Reflection"
    },
    {
      day_number: 27,
      title: "Event Documentation",
      prompt_text: "Photograph a local event or gathering. Apply wedding photography skills to different celebrations.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 20-24",
      phase: "Post-Wedding Reflection"
    },
    {
      day_number: 28,
      title: "Bulk Loading Practice Session",
      prompt_text: "While shooting, spend evening practicing bulk loading with dummy film or old leader. Get comfortable with the process.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 25-29",
      phase: "Post-Wedding Reflection",
      special_notes: "Practice bulk loading with dummy film"
    },

    // Days 29-35: Cinematic Experiments Week (Oct 9-15)
    {
      day_number: 29,
      title: "Cinema Stock Introduction",
      prompt_text: "Finish Kentmere studying cinema-like compositions. Prepare for tomorrow's cinematic stock.",
      film_suggestion: "Kentmere Pan 100",
      frame_range: "Frame 30-33",
      phase: "Cinematic Experiments Week"
    },
    {
      day_number: 30,
      title: "Vintage Cinema Look",
      prompt_text: "First cinema stock! This expired Vision2 500T creates vintage looks. Study color temperature and contrast.",
      film_suggestion: "Load Dealer's V2 500T",
      frame_range: "New roll",
      phase: "Cinematic Experiments Week"
    },
    {
      day_number: 31,
      title: "Film Noir Aesthetic",
      prompt_text: "Use cinematic stock for noir-inspired images. Dramatic shadows, mysterious subjects.",
      film_suggestion: "Dealer's V2 500T",
      frame_range: "Frame 2-5",
      phase: "Cinematic Experiments Week"
    },
    {
      day_number: 32,
      title: "Overcast Cinema",
      prompt_text: "How does expired cinema stock handle overcast light? Different from fresh film?",
      film_suggestion: "Dealer's V2 500T",
      frame_range: "Frame 6-9",
      phase: "Cinematic Experiments Week"
    },
    {
      day_number: 33,
      title: "First HP5 Bulk Loading Attempt",
      prompt_text: "While shooting, make your first attempt at bulk loading HP5. Start with short test roll (12-18 exposures).",
      film_suggestion: "Dealer's V2 500T",
      frame_range: "Frame 10-13",
      phase: "Cinematic Experiments Week",
      special_notes: "First HP5 bulk loading attempt"
    },
    {
      day_number: 34,
      title: "Night Cinematography",
      prompt_text: "Cinema stocks excel at night. Test tungsten balance with artificial lighting.",
      film_suggestion: "Dealer's V2 500T",
      frame_range: "Frame 14-17",
      phase: "Cinematic Experiments Week"
    },
    {
      day_number: 35,
      title: "Bulk Loading Success Check",
      prompt_text: "If HP5 bulk loading went well, plan to start using it soon. If not, practice more this week.",
      film_suggestion: "Dealer's V2 500T",
      frame_range: "Frame 18-21",
      phase: "Cinematic Experiments Week",
      special_notes: "Check bulk loading success"
    },

    // Days 36-42: First HP5 Week (Oct 16-22)
    {
      day_number: 36,
      title: "First HP5 Roll",
      prompt_text: "Congratulations! First frames on your bulk-loaded HP5. How does it feel to shoot film you loaded yourself?",
      film_suggestion: "Load First HP5 bulk-loaded roll",
      frame_range: "New roll",
      phase: "First HP5 Week"
    },
    {
      day_number: 37,
      title: "HP5 Grain Character",
      prompt_text: "Study HP5's famous grain structure. How does it compare to Kentmere Pan 100?",
      film_suggestion: "HP5",
      frame_range: "Frame 2-6",
      phase: "First HP5 Week"
    },
    {
      day_number: 38,
      title: "Contrast Experiments",
      prompt_text: "HP5 handles contrast well. Test high contrast vs. low contrast scenes.",
      film_suggestion: "HP5",
      frame_range: "Frame 7-11",
      phase: "First HP5 Week"
    },
    {
      day_number: 39,
      title: "Zone System with HP5",
      prompt_text: "Apply zone system thinking to HP5. Its exposure latitude is forgiving.",
      film_suggestion: "HP5",
      frame_range: "Frame 12-16",
      phase: "First HP5 Week"
    },
    {
      day_number: 40,
      title: "Push Processing Preparation",
      prompt_text: "Study how HP5 responds to different exposures. Plan for push processing experiments.",
      film_suggestion: "HP5",
      frame_range: "Frame 17-21",
      phase: "First HP5 Week"
    },
    {
      day_number: 41,
      title: "Low Light Challenge",
      prompt_text: "Push HP5 to its limits. Available light only, no flash. Famous for low-light performance.",
      film_suggestion: "HP5",
      frame_range: "Frame 22-26",
      phase: "First HP5 Week"
    },
    {
      day_number: 42,
      title: "Bulk Loading Confidence",
      prompt_text: "If this roll works well, you're ready to rely on bulk-loaded HP5 for the rest of the challenge!",
      film_suggestion: "HP5",
      frame_range: "Frame 27-31",
      phase: "First HP5 Week",
      special_notes: "Confidence check for bulk loading"
    },

    // Days 43-45: Malta Offsite (Oct 23-26)
    {
      day_number: 43,
      title: "Quick Decision Making",
      prompt_text: "Short trip, fast decisions. Trust your instincts. Capture Malta's essence efficiently.",
      film_suggestion: "Load Portra 160",
      frame_range: "New roll",
      location_context: "Malta",
      phase: "Malta Offsite",
      special_notes: "Using reserved Malta films"
    },
    {
      day_number: 44,
      title: "Cultural Density",
      prompt_text: "Dense history, layered culture. How do you photograph centuries of influence in single frames?",
      film_suggestion: "Continue Portra 160 + Tri-X Pan 400",
      frame_range: "Continue + new roll",
      location_context: "Malta",
      phase: "Malta Offsite"
    },
    {
      day_number: 45,
      title: "Work Trip Balance",
      prompt_text: "Balance work obligations with photography. Stolen moments, quick observations.",
      film_suggestion: "Dealer's V3 250D",
      frame_range: "New roll",
      location_context: "Malta",
      phase: "Malta Offsite"
    },

    // Days 46-50: Malta Integration (Oct 27-31)
    {
      day_number: 46,
      title: "Architectural Inspiration",
      prompt_text: "Malta inspired you to see architecture differently. Apply this to local buildings with HP5's fine detail.",
      film_suggestion: "HP5",
      frame_range: "Frame 32-36, Load new HP5",
      phase: "Malta Integration"
    },
    {
      day_number: 47,
      title: "Historical Layers",
      prompt_text: "Find historical layers in your city. Old vs. new, past influencing present.",
      film_suggestion: "New HP5",
      frame_range: "Frame 1-4",
      phase: "Malta Integration"
    },
    {
      day_number: 48,
      title: "Efficient Storytelling",
      prompt_text: "Malta taught efficient storytelling. Apply this skill to a local subject with B&W clarity.",
      film_suggestion: "HP5",
      frame_range: "Frame 5-8",
      phase: "Malta Integration"
    },
    {
      day_number: 49,
      title: "Cultural Density at Home",
      prompt_text: "Find cultural richness in familiar places. Immigration, traditions, hidden communities.",
      film_suggestion: "HP5",
      frame_range: "Frame 9-12",
      phase: "Malta Integration"
    },
    {
      day_number: 50,
      title: "Pre-Japan Preparation",
      prompt_text: "Final preparations for your biggest photography adventure. What are your Japan goals?",
      film_suggestion: "HP5",
      frame_range: "Frame 13-16",
      phase: "Malta Integration",
      special_notes: "Prepare for Japan trip"
    },

    // Days 51-71: Japan Honeymoon (Oct 31 - Nov 20)
    {
      day_number: 51,
      title: "Tokyo Arrival",
      prompt_text: "First impressions of Japan. Overwhelming sensory input, cultural differences, excitement.",
      film_suggestion: "Load Portra 400",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon",
      special_notes: "Using reserved Japan films - 30 rolls total"
    },
    {
      day_number: 52,
      title: "Traditional Architecture",
      prompt_text: "Temples, traditional buildings. How does ancient architecture feel in modern contexts?",
      film_suggestion: "Continue Portra 400",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 53,
      title: "Modern Contrast",
      prompt_text: "Ultra-modern Tokyo vs. traditional spaces. Document this unique juxtaposition.",
      film_suggestion: "Load Portra 800",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 54,
      title: "Street Food Culture",
      prompt_text: "Food culture through photography. Preparation, presentation, consumption rituals.",
      film_suggestion: "Continue Portra 800",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 55,
      title: "Subway Observations",
      prompt_text: "Japanese subway etiquette and behavior. Subtle social interactions.",
      film_suggestion: "Continue Portra 800",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 56,
      title: "Couple Portraits",
      prompt_text: "Document yourselves in Japan. Honeymoon intimacy against exotic backdrops.",
      film_suggestion: "Load Portra 160",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 57,
      title: "Detail Obsession",
      prompt_text: "Japanese attention to detail. Find examples in signage, food presentation, design.",
      film_suggestion: "Continue Portra 160",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 58,
      title: "Garden Philosophy",
      prompt_text: "Japanese gardens. Space, negative space, intentional placement.",
      film_suggestion: "Continue Portra 160",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 59,
      title: "Urban Density",
      prompt_text: "Tokyo's incredible density. How do millions of people coexist?",
      film_suggestion: "Load Pro Image 100",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 60,
      title: "Rural Contrast",
      prompt_text: "Escape to rural Japan. How does countryside differ from urban intensity?",
      film_suggestion: "Continue Pro Image 100",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 61,
      title: "Night Photography",
      prompt_text: "Tokyo at night with tungsten film. Neon, street lights, urban glow.",
      film_suggestion: "Load CineStill 800T",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 62,
      title: "Fashion and Style",
      prompt_text: "Japanese fashion sense. Street style, uniformity vs. individuality.",
      film_suggestion: "Load Santa Color 100",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 63,
      title: "Shrine Rituals",
      prompt_text: "Religious practices and rituals. Respectful documentation of spiritual moments.",
      film_suggestion: "Continue Santa Color 100",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 64,
      title: "Kyoto Traditions",
      prompt_text: "Traditional Kyoto in fine detail. Geishas, temples, preserved culture.",
      film_suggestion: "Load Adox HR 50",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 65,
      title: "Bullet Train Journey",
      prompt_text: "Travel day photography. Speed, landscape, journey as destination.",
      film_suggestion: "Load Dealer's V3 500T",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 66,
      title: "Mount Fuji Quest",
      prompt_text: "The iconic mountain. How do you photograph something so over-photographed?",
      film_suggestion: "Continue Dealer's V3 500T",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 67,
      title: "Hot Spring Culture",
      prompt_text: "Onsen culture (external areas only). Relaxation, tradition, natural settings.",
      film_suggestion: "Load Fujicolor 200",
      frame_range: "New roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 68,
      title: "Market Interactions",
      prompt_text: "Tsukiji and other markets. Commerce, fresh ingredients, morning energy.",
      film_suggestion: "Continue Fujicolor 200",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 69,
      title: "Final Tokyo Night",
      prompt_text: "Last night in Tokyo. Reflection, nostalgia, gratitude.",
      film_suggestion: "Continue Portra 800",
      frame_range: "Continue roll",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 70,
      title: "Departure Preparation",
      prompt_text: "Packing, final shots, saying goodbye to incredible experiences.",
      film_suggestion: "Any remaining Japan film",
      frame_range: "Remaining frames",
      location_context: "Japan",
      phase: "Japan Honeymoon"
    },
    {
      day_number: 71,
      title: "Travel Day",
      prompt_text: "Airport, journey home, reverse culture shock beginning.",
      film_suggestion: "Finish Japan rolls",
      frame_range: "Final Japan frames",
      location_context: "Japan to Home",
      phase: "Japan Honeymoon"
    },

    // Days 72-78: Japan Integration Week (Nov 21-27)
    {
      day_number: 72,
      title: "Reverse Culture Shock",
      prompt_text: "Home feels different after Japan. What do you notice that was invisible before?",
      film_suggestion: "Load HP5",
      frame_range: "New roll",
      phase: "Japan Integration Week"
    },
    {
      day_number: 73,
      title: "Japan Memory Triggers",
      prompt_text: "Find elements at home that remind you of Japan. Architecture, food, behavior.",
      film_suggestion: "HP5",
      frame_range: "Frame 2-5",
      phase: "Japan Integration Week"
    },
    {
      day_number: 74,
      title: "Minimalism Practice",
      prompt_text: "Apply Japanese minimalism to photography. What can you remove from compositions?",
      film_suggestion: "HP5",
      frame_range: "Frame 6-9",
      phase: "Japan Integration Week"
    },
    {
      day_number: 75,
      title: "Detail Appreciation",
      prompt_text: "Japanese detail obsession applied locally. Find overlooked craftsmanship.",
      film_suggestion: "HP5",
      frame_range: "Frame 10-13",
      phase: "Japan Integration Week"
    },
    {
      day_number: 76,
      title: "Urban Density Comparison",
      prompt_text: "How does your city's density compare to Tokyo? Different approaches to space.",
      film_suggestion: "HP5",
      frame_range: "Frame 14-17",
      phase: "Japan Integration Week"
    },
    {
      day_number: 77,
      title: "Ritual Documentation",
      prompt_text: "Document local rituals with the same respect you brought to Japanese shrines.",
      film_suggestion: "HP5",
      frame_range: "Frame 18-21",
      phase: "Japan Integration Week"
    },
    {
      day_number: 78,
      title: "East Meets West",
      prompt_text: "Find Japanese influence in your local environment. Restaurants, gardens, design.",
      film_suggestion: "HP5",
      frame_range: "Frame 22-25",
      phase: "Japan Integration Week"
    },

    // Days 79-85: Documentary Project Week (Nov 28 - Dec 4)
    {
      day_number: 79,
      title: "Project Definition",
      prompt_text: "Start a week-long documentary project. Choose a local subject worth deep exploration.",
      film_suggestion: "HP5",
      frame_range: "Frame 26-29",
      phase: "Documentary Project Week"
    },
    {
      day_number: 80,
      title: "Context Establishment",
      prompt_text: "Establish the broader context of your documentary subject.",
      film_suggestion: "HP5",
      frame_range: "Frame 30-33",
      phase: "Documentary Project Week"
    },
    {
      day_number: 81,
      title: "Character Introduction",
      prompt_text: "Introduce key people or elements in your documentary story.",
      film_suggestion: "HP5",
      frame_range: "Frame 34-36, Load new HP5",
      phase: "Documentary Project Week"
    },
    {
      day_number: 82,
      title: "Process Documentation",
      prompt_text: "Show how things work, how decisions are made, daily routines.",
      film_suggestion: "New HP5",
      frame_range: "Frame 1-4",
      phase: "Documentary Project Week"
    },
    {
      day_number: 83,
      title: "Emotional Core",
      prompt_text: "What's the emotional heart of your documentary subject?",
      film_suggestion: "HP5",
      frame_range: "Frame 5-8",
      phase: "Documentary Project Week"
    },
    {
      day_number: 84,
      title: "Environmental Context",
      prompt_text: "Show how place influences your subject. Location as character.",
      film_suggestion: "HP5",
      frame_range: "Frame 9-12",
      phase: "Documentary Project Week"
    },
    {
      day_number: 85,
      title: "Resolution/Conclusion",
      prompt_text: "Conclude your documentary story. What change or resolution can you show?",
      film_suggestion: "HP5",
      frame_range: "Frame 13-16",
      phase: "Documentary Project Week"
    },

    // Days 86-92: Experimental Week (Dec 5-11)
    {
      day_number: 86,
      title: "Double Exposure",
      prompt_text: "Experiment with multiple exposures. Overlay meanings, create surreal combinations.",
      film_suggestion: "HP5",
      frame_range: "Frame 17-20",
      phase: "Experimental Week"
    },
    {
      day_number: 87,
      title: "Unusual Angles",
      prompt_text: "Extreme perspectives. Drone-like high angles, worm's eye views, tilted horizons.",
      film_suggestion: "HP5",
      frame_range: "Frame 21-24",
      phase: "Experimental Week"
    },
    {
      day_number: 88,
      title: "Abstract from Reality",
      prompt_text: "Find abstract compositions in everyday subjects. Focus on shape, line, form.",
      film_suggestion: "HP5",
      frame_range: "Frame 25-28",
      phase: "Experimental Week"
    },
    {
      day_number: 89,
      title: "Intentional Camera Movement",
      prompt_text: "Move camera during exposure. Create painterly effects with photography.",
      film_suggestion: "HP5",
      frame_range: "Frame 29-32",
      phase: "Experimental Week"
    },
    {
      day_number: 90,
      title: "Light Painting",
      prompt_text: "Long exposures with moving light sources. Draw with light in darkness.",
      film_suggestion: "HP5",
      frame_range: "Frame 33-36, Load Scala 50",
      phase: "Experimental Week"
    },
    {
      day_number: 91,
      title: "Slide Film Experiment",
      prompt_text: "B&W slide film creates unique look. High contrast, different developing process.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 1-4",
      phase: "Experimental Week"
    },
    {
      day_number: 92,
      title: "Conceptual Photography",
      prompt_text: "Photography that illustrates ideas rather than documents reality.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 5-8",
      phase: "Experimental Week"
    },

    // Days 93-100: Final Portfolio Week (Dec 12-19)
    {
      day_number: 93,
      title: "Portfolio Review",
      prompt_text: "Review your best work from 100 days. Use special B&W slide film for portfolio work.",
      film_suggestion: "Load Adox Scala 50",
      frame_range: "New roll",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 94,
      title: "Style Definition",
      prompt_text: "What photographic style have you developed? Show your unique voice with this unique film.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 2-5",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 95,
      title: "Technical Mastery",
      prompt_text: "Demonstrate technical skills with this challenging slide film. Perfect exposure required.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 6-9",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 96,
      title: "Emotional Resonance",
      prompt_text: "Create images that move viewers emotionally. Technique serving feeling.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 10-13",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 97,
      title: "Narrative Completion",
      prompt_text: "Tell a complete story in a few frames. Beginning, middle, end.",
      film_suggestion: "Scala 50",
      frame_range: "Frame 14-17",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 98,
      title: "Local Pride",
      prompt_text: "Photograph your city/area with the same wonder you brought to travels.",
      film_suggestion: "Load Final Portra 160",
      frame_range: "New roll",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 99,
      title: "Future Vision",
      prompt_text: "Photograph something that represents your photographic future.",
      film_suggestion: "Portra 160",
      frame_range: "Frame 2-5",
      phase: "Final Portfolio Week"
    },
    {
      day_number: 100,
      title: "Final Frame",
      prompt_text: "Your final exposure of the challenge. Make it count. What represents your growth?",
      film_suggestion: "Portra 160",
      frame_range: "Frame 6",
      phase: "Final Portfolio Week",
      special_notes: "Final exposure of the 100-day challenge"
    }
  ]
}

// Helper function to create challenge with prompts
export async function createChallenge100Days(userId: string) {
  return {
    challenge: {
      user_id: userId,
      ...challenge100Days
    },
    prompts: challenge100Days.prompts.map(prompt => ({
      ...prompt,
      challenge_id: '', // Will be filled when challenge is created
    }))
  }
}

// Helper functions to filter prompts by phase
export function getPromptsByPhase(phase: string) {
  return challenge100Days.prompts.filter(prompt => prompt.phase === phase);
}

export function getTravelPrompts() {
  return challenge100Days.prompts.filter(prompt => prompt.location_context);
}

export function getBulkLoadingPrompts() {
  return challenge100Days.prompts.filter(prompt => 
    prompt.special_notes && prompt.special_notes.includes('bulk loading')
  );
}
