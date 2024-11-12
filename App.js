import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';


const getMoistureStatus = (value) => {
  if (value < 3) return 'Wet'; // Very wet
  if (value >= 3 && value <= 5) return 'Normal'; // Normal range
  return 'Dry'; // Very dry
};
const PHBarGraph = ({ value, valueLabel }) => {
  const heights = Array.from({ length: 14 }, (_, i) => (i + 1) * 5);

  const bars = heights.map((height, index) => {
    const barIndex = index + 1; // pH values range from 1 to 14
    const isActive = barIndex <= value; // Determine if this bar should be filled
    const barColor = isActive ? getColorForPH(barIndex) : '#d3d3d3'; // Gray color for bars above value
    return (
      <View key={index} style={styles.barContainer}>
        <View style={[styles.phBar, { height: isActive ? height : 0, backgroundColor: barColor }]} />
        <Text style={styles.barLabel}>{barIndex}</Text>
      </View>
    );
  });
  return (
    <View style={styles.phContainer}>
      <Text style={{ fontSize: 30, margin: 10 }}>pH {valueLabel}: {value}</Text>
      <View style={styles.barsContainer}>
        {bars}
      </View>
    </View>
  );
};

const getColorForPH = (value) => {
  if (value < 7) return '#ff0000'; // Red for acidic
  if (value > 7) return '#00ff00'; // Green for basic
  return '#ffff00'; // Yellow for neutral
};

const GraphComponent = ({ data, setSelectedDay, selectedDay, value, valueLabel }) => {
  useEffect(() => {
    const currentDayIndex = new Date().getDay(); // Get the current day (0-6)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setSelectedDay(days[currentDayIndex]); // Set the selected day to the current day
  }, [setSelectedDay]);

  return (
    <View style={styles.allDataContainer}>
      <Text style={{ fontSize: 30, marginLeft: 40, margin: 10 }}>
        {value}{valueLabel}
      </Text>
      <View style={styles.dataContainer}>
        {Array.isArray(data) && data.length === 24 ? (
          data.map((value, hour) => (
            <View key={hour} style={styles.dataColumn}>
              <View style={{ ...styles.bar, height: value * 1.5 }}>
                <View style={styles.overlayBar}></View>
                <Text style={styles.valueText}>{value}</Text>

              </View>
            </View>
          ))
        ) : (
          <Text>Loading data...</Text>
        )}
      </View>
      {/* Days selection for temperature and humidity */}
      <View style={styles.days}>
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <Pressable
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.activeDayButton]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayButtonText, selectedDay === day && styles.activeDayButton]}>
              {day}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const GraphButton = ({ onPress, title, isSelected }) => (
  <TouchableOpacity onPress={onPress} style={[styles.GraphButton, isSelected && styles.selectedButton]}>
    <Text style={[styles.buttonText, isSelected && styles.selectedButtonText]}>{title}</Text>
  </TouchableOpacity>
);

export default function App() {
  const [tempData, setTempData] = useState(Array(24).fill(0));
  const [humidityData, setHumidityData] = useState(Array(24).fill(0));
  const [phData, setPhData] = useState(Array(24).fill(0));
  const [moistureData, setMoistureData] = useState(Array(24).fill(0));
  const [selectedGraph, setSelectedGraph] = useState('Temperature');
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [temp, setTemp] = useState('N/A');
  const [moisture, setMoisture] = useState('N/A');
  const [ph, setPh] = useState('N/A');
  const [humidity, setHumidity] = useState('N/A');
  const [todayLogs, setTodayLogs] = useState([]);
  const [phLogs, setPhLogs] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [moistureLogs, setMoistureLogs] = useState([]);
  const today = new Date().toLocaleString('en-US', { weekday: 'long' }); // Get today's name
  const maxValue = 15; // Max moisture level
  const radius = 50; // Radius of the gauge
  const strokeWidth = 10; // Width of the stroke
  const center = radius + strokeWidth; // Center point of the gauge

  useEffect(() => {
    const fetchLogData = () => {
      fetch(`https://api.ehub.ph/log.json?timestamp=${new Date().getTime()}`)
        .then(response => response.json())
        .then(jsonData => {
          console.log('Fetched log data:', jsonData);
          if (Array.isArray(jsonData)) {
            const filteredLogs = jsonData.filter(entry => entry.day === selectedDay);
            setTodayLogs(filteredLogs);
            console.log('Filtered logs:', filteredLogs);

            // Prepare data for the bar graph
            const tempHourlyData = Array(24).fill(0);
            const humidityHourlyData = Array(24).fill(0);
            const phHourlyData = Array(24).fill(0);
            const moistureHourlyData = Array(24).fill(0);

            // Collect pH logs and their timestamps
            const pHValues = [];
            const timeValues = [];
            const moistureValues = []; // Initialize moistureValues

            filteredLogs.forEach(entry => {
              const hour = parseInt(entry.context.timestamp.split(':')[0], 10);
              tempHourlyData[hour] = entry.context.temp || 0;
              humidityHourlyData[hour] = entry.context.humidity || 0;
              phHourlyData[hour] = entry.context.ph || 0;
              moistureHourlyData[hour] = entry.context.moisture || 0;

              // Collect pH, moisture, and timestamps
              pHValues.push(entry.context.ph);
              moistureValues.push(entry.context.moisture); // Use the defined moistureValues
              timeValues.push(entry.context.timestamp);
            });

            setTempData(tempHourlyData);
            setHumidityData(humidityHourlyData);
            setPhData(phHourlyData);
            setMoistureData(moistureHourlyData);
            setPhLogs(pHValues);
            setTimeLogs(timeValues);
            setMoistureLogs(moistureValues); // Store moisture values
          }
        })
        .catch(error => console.error('Error fetching log data:', error));
    };

    fetchLogData();
    const interval = setInterval(fetchLogData, 100000);
    return () => clearInterval(interval);
  }, [selectedDay]);


  // In your render method:
  console.log('Today logs state:', todayLogs);

  useEffect(() => {
    const fetchDataJson = () => {
      fetch(`https://api.ehub.ph/data.json?timestamp=${new Date().getTime()}`)
        .then(response => response.json())
        .then(jsonData => {
          if (jsonData && jsonData.data) {
            setTemp(jsonData.data.temp || 'N/A');
            setHumidity(jsonData.data.humidity || 'N/A');
            setPh(jsonData.data.ph || 'N/A');
            setMoisture(jsonData.data.moisture || 'N/A');
            console.log('Fetched data:', jsonData);
          } else {
            console.log('Fetched data.json missing data or moisture:', jsonData);
          }
        })
        .catch(error => console.error('Error fetching data:', error));
    };
    fetchDataJson();
    const interval = setInterval(fetchDataJson, 1000);
    return () => clearInterval(interval);
  }, [selectedDay]);


  const normalizedValue = Math.min(Math.max(moisture, 0), maxValue); // Use fetched moisture value
  const percentage = (normalizedValue / maxValue) * 100;
  const circumference = 2 * Math.PI * radius;

  // Calculate strokeDasharray for the progress
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Determine color based on moisture level
  const getColorForMoisture = (value) => {
    if (value < 3) return '#ff0000'; // Very wet: red
    if (value >= 3 && value <= 5) return '#4caf50'; // Normal: green
    return '#ffcc00'; // Very dry: yellow
  };

  const strokeColor = getColorForMoisture(normalizedValue); // Get color based on value

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.welcomeContainer}>
          <Text style={{ fontSize: 30 }}>Welcome Back, Clareah!</Text>
        </View>
        <View style={styles.navContainer}>
          <Pressable style={{ ...styles.navButton, backgroundColor: '#000' }}>
            <Text style={{ ...styles.textButton, color: '#fff' }}>Overview</Text>
          </Pressable>
          <Pressable style={styles.navButton}>
            <Text style={styles.textButton}>History</Text>
          </Pressable>
        </View>
        <View style={styles.graphnavContainer}>
          <GraphButton
            onPress={() => setSelectedGraph('Temperature')}
            title="Temperature"
            isSelected={selectedGraph === 'Temperature'}
          />
          <GraphButton
            onPress={() => setSelectedGraph('Humidity')}
            title="Humidity"
            isSelected={selectedGraph === 'Humidity'}
          />
        </View>
        <View style={styles.graphContainer}>
          {selectedGraph === 'Temperature' ? (
            <GraphComponent data={tempData} setSelectedDay={setSelectedDay} selectedDay={selectedDay} value={temp} valueLabel="°C" />
          ) : (
            <GraphComponent data={humidityData} setSelectedDay={setSelectedDay} selectedDay={selectedDay} value={humidity} valueLabel="%" />
          )}
        </View>
        <View style={styles.soilContainer}>
          <Text style={{ fontSize: 30 }}>Soil</Text>
        </View>

        <PHBarGraph value={ph} />

        <View style={styles.lastContainer}>

          <View style={styles.moistContainer}>
            <Svg height={center * 2} width={center * 2}>
              <G rotation="-90" origin={`${center}, ${center}`}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#d3d3d3" // Background color
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={strokeColor} // Set dynamic color
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                />
              </G>
            </Svg>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Soil Moisture</Text>
            <Text style={{ position: 'absolute', top: center + 5, left: center - -8, fontSize: 20, fontWeight: 'bold' }}>
              {`${normalizedValue}`} CB
            </Text>
            <Text style={{ position: 'absolute', top: center + 25, left: center - -13, fontSize: 16, fontWeight: 'bold' }}>
              {getMoistureStatus(normalizedValue)}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <View style={styles.phLogContainer}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>pH Log</Text>
              <ScrollView style={{ flexGrow: 0 }}>
                {phLogs.length > 0 ? (
                  phLogs.map((ph, index) => (
                    <Text key={index}>{`${timeLogs[index]}: ${ph} pH`}</Text>
                  ))
                ) : (
                  <Text>No pH logs for today.</Text>
                )}
              </ScrollView>
            </View>
            <View style={styles.moistureLogContainer}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Moisture Log</Text>
              <ScrollView style={{ flexGrow: 0 }}>
                {moistureLogs.length > 0 ? (
                  moistureLogs.map((moisture, index) => (
                    <Text key={index}>{`${timeLogs[index]}: ${moisture} moisture`}</Text>
                  ))
                ) : (
                  <Text>No moisture logs for today.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  buttonContainer: {
    marginTop: 60,
    margin: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
  },
  navContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  navButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
  },
  graphnavContainer: {
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
  GraphButton: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    paddingHorizontal: 60,
    borderTopStartRadius: 15,
    borderTopEndRadius: 15,
  },
  selectedButton: {
    backgroundColor: '#cae3df',
  },
  graphContainer: {
    marginHorizontal: 'auto',
    backgroundColor: '#cae3df',
    borderBottomStartRadius: 25,
    borderBottomEndRadius: 25,
    width: Dimensions.get('window').width - 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  allDataContainer: {
    flex: 1,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    borderRadius: 25,
    border: 1,
  },
  dataColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 5,
  },
  bar: {
    width: 7,
    backgroundColor: '#0005',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    flexWrap: 'nowrap'
  },
  valueText: {
    color: '#000',
    marginBottom: 1,
    fontSize: 11,
    transform: [{ rotate: '90deg' }],
    flexWrap: 'wrap',
    width: 25,
  },
  overlayBar: {
    backgroundColor: '#0006',
    width: 10,
    borderRadius: 100,
    height: 10,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 20,
  },
  dayButton: {
    paddingVertical: 10,
  },
  activeDayButton: {
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: 25,
    paddingHorizontal: 2,
  },
  soilContainer: {
    marginTop: 30,
    marginHorizontal: 30
  },
  graphContainer1: {
    alignItems: 'center',
  },
  phContainer: {
    alignItems: 'center', // Center the content horizontally
  },
  barsContainer: {
    flexDirection: 'row', // Stack bars vertically
    alignItems: 'flex-end', // Align bars to the right (or change as needed)
    justifyContent: 'center', // Stack from bottom to top
    width: Dimensions.get('window').width - 40, // Adjust width for the bars
    backgroundColor: '#cae3df',
    borderRadius: 25,
    paddingVertical: 20
  },
  barContainer: {
    flexDirection: 'column', // Ensure labels and bars are in a column
    alignItems: 'center', // Center the labels under the bars
  },
  phBar: {
    width: 20, // Width of each bar
  },
  barLabel: {
    marginTop: 5,
    fontSize: 12,
  },
  moistContainer: {
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#cae3df',
    borderRadius: 25,
    marginVertical: 25,
  },
  lastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: Dimensions.get('window').width - 40,
    gap: 20,
    margin: 'auto'
  },
  card: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'center',
    overflow: 'scroll',
    gap: 20
  },
  logItem: {
    backgroundColor: '#cae3df',
    padding: 25,
  },
  rightContainer: {
    gap: 20
  },
  phLogContainer: {
    backgroundColor: '#cae3df',
    borderRadius: 25,
    height: 80, // Set a fixed height
    overflow: 'hidden', // Hide overflow content
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
  },
  moistureLogContainer: {
    backgroundColor: '#cae3df',
    borderRadius: 25,
    height: 80, // Set a fixed height
    overflow: 'auto', // Hide overflow content
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
});

