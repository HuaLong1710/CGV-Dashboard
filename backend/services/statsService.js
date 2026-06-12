const supabase = require("../config/supabase");

const TABLE_NAME = process.env.TABLE_NAME || "CGV";

const COLS = {
  province: "Tỉnh thành",
  cinemaGroup: "Cụm Rạp",
  cinema: "Tên Rạp",
  movie: "Tên Phim",
  bookingDate: "Ngày Đặt",
  showDate: "Ngày Chiếu",
  ticketType: "Loại vé",
  listedPrice: "Giá niêm yết (Rạp)",
  vnPayPrice: "Giá bán (VNPAY)",
  vnPayTicketType: "Loại vé từ VNPAY",
};

/* Đếm tổng số dòng */
async function getTotalRows() {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select("*", {
      count: "estimated",
      head: true,
    });

  if (error) {
    console.log("getTotalRows error:", error);
    throw error;
  }

  return count || 0;
}

/* Lấy top theo 1 cột, xử lý theo từng trang */
async function getTopByColumn(columnName, limit = 10) {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  const counter = {};

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${columnName}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      const key = row[columnName] || "Không rõ";
      counter[key] = (counter[key] || 0) + 1;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

async function getTopRevenueByColumn(columnName, limit = 10) {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  const revenueMap = {};

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${columnName}", "${COLS.vnPayPrice}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      const key = row[columnName] || "Không rõ";
      const revenue = Number(row[COLS.vnPayPrice] || 0);

      revenueMap[key] = (revenueMap[key] || 0) + revenue;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return Object.entries(revenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, revenue]) => ({
      name,
      revenue,
    }));
}

/* Tính doanh thu cơ bản theo từng trang */
async function getRevenueSummary() {
  const pageSize = 10000;
  let from = 0;
  let to = pageSize - 1;
  let hasMore = true;

  let totalRevenue = 0;
  let totalTickets = 0;
  let totalListedRevenue = 0;

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`"${COLS.vnPayPrice}", "${COLS.listedPrice}"`)
      .range(from, to);

    if (error) throw new Error(error.message);

    data.forEach((row) => {
      totalRevenue += Number(row[COLS.vnPayPrice] || 0);
      totalListedRevenue += Number(row[COLS.listedPrice] || 0);
      totalTickets += 1;
    });

    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
      to += pageSize;
    }
  }

  return {
    totalRevenue,
    totalListedRevenue,
    totalTickets,
    averagePrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
  };
}

async function getTopMoviesStats(limit = 10) {
  const { data, error } = await supabase
    .from("movie_stats")
    .select("*")
    .order("transaction_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopProvincesStats(limit = 10) {
  const { data, error } = await supabase
    .from("province_stats")
    .select("*")
    .order("transaction_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopCinemasStats(limit = 10) {
  const { data, error } = await supabase
    .from("cinema_stats")
    .select("*")
    .order("transaction_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopTicketTypesStats(limit = 10) {
  const { data, error } = await supabase
    .from("ticket_type_stats")
    .select("*")
    .order("transaction_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopMovieRevenue(limit = 10) {
  const { data, error } = await supabase
    .from("movie_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopProvinceRevenue(limit = 10) {
  const { data, error } = await supabase
    .from("province_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getOverviewStats() {
  const { data, error } = await supabase
    .from("overview_stats")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function getTopMoviesByProvince(provinceName, limit = 10) {
  const { data, error } = await supabase
    .from("movie_province_stats")
    .select("*")
    .ilike("province_name", `%${provinceName}%`)
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTopCinemasByProvince(provinceName, limit = 10) {
  const { data, error } = await supabase
    .from("cinema_province_stats")
    .select("*")
    .ilike("province_name", `%${provinceName}%`)
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMovieMonthlyStats(movieName, limit = 12) {
  const { data, error } = await supabase
    .from("movie_month_stats")
    .select("*")
    .ilike("movie_name", `%${movieName}%`)
    .order("month", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMarketingPriorityProvinces(limit = 5) {
  const { data, error } = await supabase
    .from("province_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMovieBusinessFocus(limit = 5) {
  const { data, error } = await supabase
    .from("movie_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getCinemaExpansionCandidates(limit = 10) {
  const { data, error } = await supabase
    .from("province_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getTicketBusinessValue(limit = 5) {
  const { data, error } = await supabase
    .from("ticket_type_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getHighRevenueLowTransactionProvinces(limit = 10) {
  const { data, error } = await supabase
    .from("province_stats")
    .select("*")
    .order("avg_price", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getPromotionByProvince(limit = 10) {
  const { data, error } = await supabase
    .from("promo_province_stats")
    .select("*")
    .order("promo_rate", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMonthlyStats() {
  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*")
    .order("month_number", { ascending: true });

  if (error) throw error;
  return data;
}

async function getHighestRevenueMonth() {
  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*")
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

async function getLowestRevenueMonth() {
  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*")
    .order("total_revenue", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

async function getMonthStats(monthNumber, yearNumber = 2025) {
  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*")
    .eq("month_number", monthNumber)
    .eq("year_number", yearNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getWeekdayStats() {
  const { data, error } = await supabase
    .from("weekday_stats")
    .select("*")
    .order("weekday_number", { ascending: true });

  if (error) throw error;
  return data;
}

async function getHighestDemandWeekday() {
  const { data, error } = await supabase
    .from("weekday_stats")
    .select("*")
    .order("tickets", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

async function getLowestDemandWeekday() {
  const { data, error } = await supabase
    .from("weekday_stats")
    .select("*")
    .order("tickets", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

async function getRegionStats() {
  const { data, error } = await supabase
    .from("region_stats")
    .select("*")
    .order("total_revenue", {
      ascending: false,
    });

  if (error) throw error;
  return data;
}

async function getTopRegion() {
  const { data, error } = await supabase
    .from("region_stats")
    .select("*")
    .order("total_revenue", {
      ascending: false,
    })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

async function getPriceRegionStats() {
  const { data, error } = await supabase
    .from("price_region_stats")
    .select("*")
    .order("avg_price", { ascending: false });

  if (error) throw error;
  return data;
}

async function getTicketRegionStats(limit = 20) {
  const { data, error } = await supabase
    .from("ticket_region_stats")
    .select("*")
    .order("tickets", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMovieRevenueShare(limit = 10) {
  const { data, error } = await supabase
    .from("movie_stats")
    .select("*")
    .order("revenue_share", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMovieEfficiencyStats(limit = 10) {
  const { data, error } = await supabase
    .from("movie_efficiency_stats")
    .select("*")
    .order("revenue_per_day", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getEarlyBookingMovies(limit = 10) {
  const { data, error } = await supabase
    .from("movie_booking_stats")
    .select("*")
    .order("early_booking_rate", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getMonthlyGrowthStats() {
  const { data, error } = await supabase
    .from("monthly_growth_stats")
    .select("*")
    .order("month_number");

  if (error) throw error;
  return data;
}

async function getMarketingOpportunities(limit = 10) {
  const { data, error } = await supabase
    .from("marketing_opportunity_stats")
    .select("*")
    .order("revenue", {
      ascending: true
    })
    .limit(limit);

  if (error) throw error;
  return data;
}

module.exports = {
  getTotalRows,
  getTopByColumn,
  getTopRevenueByColumn,
  getRevenueSummary,
  getTopMoviesStats,
  getTopProvincesStats,
  getTopCinemasStats,
  getTopTicketTypesStats,
  getTopMovieRevenue,
  getTopProvinceRevenue,
  getOverviewStats,
  getTopMoviesByProvince,
  getTopCinemasByProvince,
  getMovieMonthlyStats,
  getMarketingPriorityProvinces,
  getMovieBusinessFocus,
  getCinemaExpansionCandidates,
  getTicketBusinessValue,
  getHighRevenueLowTransactionProvinces,
  getPromotionByProvince,
  getMonthlyStats,
  getMonthStats,
  getHighestRevenueMonth,
  getLowestRevenueMonth,
  getWeekdayStats,
  getHighestDemandWeekday,
  getLowestDemandWeekday,
  getRegionStats,
  getTopRegion,
  getPriceRegionStats,
  getTicketRegionStats,
  getMovieRevenueShare,
  getMovieEfficiencyStats,
  getEarlyBookingMovies,
  getMonthlyGrowthStats,
  getMarketingOpportunities,
};