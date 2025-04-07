import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
} from 'lucide-react-native';
import axios from 'axios';

// API Key and location
const API_KEY = process.env.EXPO_PUBLIC_API_KEY_WEATHER!;
const LOCATION = `${process.env.EXPO_PUBLIC_LATITUDE},${process.env.EXPO_PUBLIC_LONGITUDE}`;

// Get screen dimensions
const { width } = Dimensions.get('window');

interface ForecastHour {
  time: string;
  temp_c: number;
  condition: {
    text: string;
    icon: string;
    code: number;
  };
}

interface WeatherData {
  current: {
    temp_c: number;
    condition: { text: string; code: number };
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    uv: number;
  };
  location: { name: string };
  forecast: {
    forecastday: {
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
      };
      hour: ForecastHour[];
    }[];
  };
}

// Weather icon mapping
const getWeatherIcon = (code: number, size = 24, color = '#fff') => {
  if (code >= 1000 && code < 1003) return <Sun size={size} color={color} />;
  if (code >= 1003 && code < 1063) return <Cloud size={size} color={color} />;
  if (code >= 1063 && code < 1200)
    return <CloudRain size={size} color={color} />;
  return <Wind size={size} color={color} />;
};

const WeatherForecast = () => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Animation values
  const expandAnimation = useRef(new Animated.Value(0)).current;

  // Sử dụng màu chủ đạo #0891b2 với hiệu ứng dịu nhẹ hơn
  const getGradientColors = (): [string, string, ...string[]] => {
    if (expanded) {
      // Expanded view: dùng alpha thấp hơn để tạo cảm giác trầm và dịu
      return [
        'rgba(8, 145, 178, 0.55)', // màu chủ đạo đậm nhưng không quá sáng
        'rgba(8, 145, 178, 0.40)', // chuyển dần sang màu nhẹ hơn
      ];
    } else {
      // Compact view: nền mờ với alpha thấp để tạo cảm giác nhẹ nhàng
      return ['rgba(8, 145, 178, 0.40)', 'rgba(8, 145, 178, 0.25)'];
    }
  };

  // Toggle expanded state with animation
  const toggleExpanded = () => {
    Animated.timing(expandAnimation, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setExpanded(!expanded);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${LOCATION}&days=1&aqi=no&alerts=no`,
        );
        setWeather(response.data);
        setErrorMsg('');
      } catch (error) {
        console.error('Weather data fetch error:', error);
        setErrorMsg('Unable to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const nextHours = useMemo(() => {
    if (!weather) return [];
    const now = new Date().getHours();
    return weather.forecast.forecastday[0].hour
      .filter((h) => new Date(h.time).getHours() >= now)
      .slice(0, 6);
  }, [weather]);

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * 80, animated: true });
  }, []);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.getHours().toString().padStart(2, '0') + ':00';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!weather) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        expanded ? styles.expandedContainer : styles.compactContainer,
      ]}
      onPress={toggleExpanded}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={expanded ? styles.gradientExpanded : styles.gradientCompact}
      >
        {expanded ? (
          <>
            {/* Header with temperature and city */}
            <View style={styles.header}>
              <View style={styles.currentCondition}>
                <View style={styles.mainTemp}>
                  {getWeatherIcon(weather.current.condition.code, 48, '#fff')}
                  <Text style={styles.tempText}>
                    {Math.round(weather.current.temp_c)}°
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.cityName}>{weather.location.name}</Text>
                  <Text style={styles.conditionText}>
                    {weather.current.condition.text}
                  </Text>
                  <Text style={styles.feelsLike}>
                    Feels like {Math.round(weather.current.feelslike_c)}°
                  </Text>
                </View>
              </View>
              {/* Weather stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Sun size={18} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statLabel}>High / Low</Text>
                  <Text style={styles.statValue}>
                    {Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}
                    °/
                    {Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Wind size={18} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statLabel}>Wind</Text>
                  <Text style={styles.statValue}>
                    {Math.round(weather.current.wind_kph)} km/h
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Droplets size={18} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statLabel}>Humidity</Text>
                  <Text style={styles.statValue}>
                    {weather.current.humidity}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Hourly forecast */}
            <View style={styles.hourlyHeader}>
              <Calendar size={16} color="#fff" />
              <Text style={styles.hourlyTitle}>Hourly Forecast</Text>
            </View>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScroll}
              decelerationRate="fast"
              snapToInterval={80}
            >
              {nextHours.map((hour, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.hourlyItem}
                  onPress={() => scrollToIndex(index)}
                >
                  <Text style={styles.hourlyTime}>{formatTime(hour.time)}</Text>
                  {getWeatherIcon(hour.condition.code, 24, '#fff')}
                  <Text style={styles.hourlyTemp}>
                    {Math.round(hour.temp_c)}°
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.minimizeHint}>Tap to minimize</Text>
          </>
        ) : (
          <View style={styles.compactInfo}>
            {getWeatherIcon(weather.current.condition.code, 24, '#fff')}
            <Text style={styles.compactTemp}>
              {Math.round(weather.current.temp_c)}°
            </Text>
            <Text style={styles.compactCity}>{weather.location.name}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loadingContainer: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.7)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Compact view
  compactContainer: {
    borderRadius: 20,
    marginBottom: 16,
  },
  gradientCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  compactTemp: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  compactCity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  // Expanded view
  expandedContainer: {
    width: width - 32,
    borderRadius: 24,
    marginVertical: 20,
    alignSelf: 'center',
  },
  gradientExpanded: {
    padding: 20,
    borderRadius: 24,
  },
  // Header section
  header: {
    marginBottom: 20,
  },
  currentCondition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mainTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempText: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '300',
  },
  locationInfo: {
    alignItems: 'flex-end',
  },
  cityName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  conditionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  feelsLike: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  // Stats section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  // Hourly forecast
  hourlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hourlyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hourlyScroll: {
    paddingVertical: 8,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    width: 76,
    height: 110,
    justifyContent: 'space-between',
  },
  hourlyTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  hourlyTemp: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Footer
  minimizeHint: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default WeatherForecast;
