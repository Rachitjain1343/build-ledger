export const projectsData = {
  "room-renovation": {
    name: "Home Room & Bathroom Renovation",
    initialEstimate: "₹2.50 Lakhs",
    revisedDesignerBudget: "₹5.50 Lakhs",
    totalSpentToDate: "₹3.54 Lakhs",
    remainingBudget: "₹1.96 Lakhs",
    activeContractors: "5 Teams",
    statusBadge: "On Track",
    
    chartData: [
      { stage: 'Initial Plan', DesignerBudget: 1.0, ActualSpent: 0 },
      { stage: 'Demolition', DesignerBudget: 1.8, ActualSpent: 0.19 },
      { stage: 'Tiling', DesignerBudget: 2.5, ActualSpent: 0.64 },
      { stage: 'Ceiling & Elec', DesignerBudget: 3.2, ActualSpent: 1.17 },
      { stage: 'Woodwork (Now)', DesignerBudget: 4.8, ActualSpent: 3.54 },
      { stage: 'Final Finish', DesignerBudget: 5.5, ActualSpent: null },
    ],

    costStatus: [
      { name: 'Spent to Date', value: 3.54, percentage: '64%', color: '#2563EB' },
      { name: 'Pending Dues', value: 0.35, percentage: '6%', color: '#F59E0B' },
      { name: 'Remaining Balance', value: 1.61, percentage: '30%', color: '#10B981' },
    ],

    stageCosts: [
      { stage: "Demolition & Bathroom Layout", category: "Civil Work", materialCost: 5000, laborCost: 14000, totalCost: 19000, status: "Completed" },
      { stage: "Bathroom & Room Tiling", category: "Masonry", materialCost: 30000, laborCost: 15000, totalCost: 45000, status: "Completed" },
      { stage: "POP False Ceiling", category: "Ceiling", materialCost: 20000, laborCost: 15000, totalCost: 35000, status: "Completed" },
      { stage: "Electrical Wiring & Boxes", category: "Electrical", materialCost: 10000, laborCost: 8000, totalCost: 18000, status: "Completed" },
      { stage: "Carpentry & Furniture", category: "Woodwork", materialCost: 180000, laborCost: 57000, totalCost: 237000, status: "In Progress" },
    ],

    upcomingPayments: [
      { item: "Window Fabricator Balance", vendor: "Local Aluminium Works", total: "₹5,000", advancePaid: "₹2,000", balanceDue: "₹3,000", dueDate: "Upon Installation" },
      { item: "Carpenter Final Labor Balance", vendor: "Carpentry Team", total: "₹57,000", advancePaid: "₹25,000", balanceDue: "₹32,000", dueDate: "Post Assembly" },
    ]
  },

  "skyline-residency": {
    name: "Skyline Residency",
    initialEstimate: "₹10.00 Cr",
    revisedDesignerBudget: "₹12.45 Cr",
    totalSpentToDate: "₹7.85 Cr",
    remainingBudget: "₹4.60 Cr",
    activeContractors: "12 Teams",
    statusBadge: "Over Budget (+12.4%)",

    chartData: [
      { stage: "Jan '25", DesignerBudget: 2.0, ActualSpent: 1.8 },
      { stage: "Feb '25", DesignerBudget: 4.0, ActualSpent: 3.5 },
      { stage: "Mar '25", DesignerBudget: 6.0, ActualSpent: 5.8 },
      { stage: "Apr '25", DesignerBudget: 8.0, ActualSpent: 7.9 },
      { stage: "May '25", DesignerBudget: 10.0, ActualSpent: 9.8 },
      { stage: "Jun '25", DesignerBudget: 12.0, ActualSpent: 11.2 },
    ],

    costStatus: [
      { name: 'Spent to Date', value: 7.85, percentage: '63%', color: '#2563EB' },
      { name: 'Committed', value: 2.15, percentage: '17%', color: '#F59E0B' },
      { name: 'Remaining Balance', value: 2.45, percentage: '20%', color: '#10B981' },
    ],

    stageCosts: [
      { stage: "Foundation & Excavation", category: "Civil Work", materialCost: 12000000, laborCost: 8000000, totalCost: 20000000, status: "Completed" },
      { stage: "2nd Floor Slab Construction", category: "Structural", materialCost: 25000000, laborCost: 15000000, totalCost: 40000000, status: "Over Budget" },
      { stage: "Plumbing & Sanitary Riser", category: "Plumbing", materialCost: 8000000, laborCost: 4000000, totalCost: 12000000, status: "In Progress" },
    ],

    upcomingPayments: [
      { item: "Steel Supply - Milestone 3", vendor: "Apex Infra Steels", total: "₹18,75,000", advancePaid: "₹50,000", balanceDue: "₹18,25,000", dueDate: "25 Jul 2025" },
      { item: "Ready-Mix Concrete Lot 4", vendor: "UltraMix Concrete", total: "₹8,40,000", advancePaid: "₹20,000", balanceDue: "₹8,20,000", dueDate: "28 Jul 2025" },
    ]
  },

  "green-heights": {
    name: "Green Heights",
    initialEstimate: "₹8.00 Cr",
    revisedDesignerBudget: "₹8.50 Cr",
    totalSpentToDate: "₹4.20 Cr",
    remainingBudget: "₹4.30 Cr",
    activeContractors: "8 Teams",
    statusBadge: "Under Budget (-3.2%)",

    chartData: [
      { stage: "Jan '25", DesignerBudget: 1.5, ActualSpent: 1.2 },
      { stage: "Feb '25", DesignerBudget: 3.0, ActualSpent: 2.8 },
      { stage: "Mar '25", DesignerBudget: 4.5, ActualSpent: 4.2 },
    ],

    costStatus: [
      { name: 'Spent to Date', value: 4.20, percentage: '49%', color: '#2563EB' },
      { name: 'Committed', value: 1.80, percentage: '21%', color: '#F59E0B' },
      { name: 'Remaining Balance', value: 2.50, percentage: '30%', color: '#10B981' },
    ],

    stageCosts: [
      { stage: "Structural Pillar Work", category: "Civil Work", materialCost: 15000000, laborCost: 9000000, totalCost: 24000000, status: "Completed" },
      { stage: "External Brick Plaster", category: "Masonry", materialCost: 9000000, laborCost: 5000000, totalCost: 14000000, status: "In Progress" },
    ],

    upcomingPayments: [
      { item: "Cement Supply Bulk", vendor: "UltraTech Depot", total: "₹1,20,00,000", advancePaid: "₹60,00,000", balanceDue: "₹60,00,000", dueDate: "02 Aug 2025" },
    ]
  }
};