import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

export default function Short({ filter, setFilter, onSortPress, activeSort }) {
  const tabs = ['Day', 'Week', 'Month', 'All'];

  const getSortIcon = () => {
    if (activeSort === 'HIGH') return 'sort-numeric-descending'; 
    if (activeSort === 'LOW') return 'sort-numeric-ascending';   
    if (activeSort === 'OLD') return 'calendar-arrow-right';    
    return 'sort-calendar-descending'; 
  };

  const isSortActive = activeSort !== 'RECENT';

  return (
    <View style={styles.container}>
      
      {/* LEFT: Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollFlex}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setFilter(t)}
            style={[styles.tab, filter === t ? styles.activeTab : styles.inactiveTab]}
          >
            <Text style={[styles.text, filter === t ? styles.activeText : styles.inactiveText]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RIGHT: Sort Button */}
      <TouchableOpacity 
        onPress={onSortPress} 
        style={[styles.sortBtn, isSortActive ? styles.activeSortBtn : styles.inactiveSortBtn]}
      >
        <IconButton 
          icon={getSortIcon()} 
          size={20} 
          iconColor={isSortActive ? '#fff' : '#000'} 
          style={{ margin: 0 }}
        />
        {/* Added Label for visibility */}
        {!isSortActive && <Text style={styles.sortLabel}>Sort</Text>}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  scrollFlex: { flex: 1 },
  scrollContent: { paddingRight: 15, alignItems: 'center' },
  
  // --- HIGH VISIBILITY TABS ---
  tab: {
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1, // Add border to define shape
  },

  // Active: Black Background
  activeTab: { 
    backgroundColor: '#000', 
    borderColor: '#000' 
  },

  // Inactive: White Background + Grey Border (POPS OUT)
  inactiveTab: { 
    backgroundColor: '#FFF', 
    borderColor: '#E0E0E0',
    elevation: 1, // Slight shadow to lift it off the page
  },
  
  // --- TEXT VISIBILITY ---
  text: { fontSize: 14, fontWeight: 'bold' }, // Increased Size + Bold
  activeText: { color: '#FFF' },
  inactiveText: { color: '#000' }, // PITCH BLACK TEXT

  // --- SORT BUTTON ---
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12, // Wider
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 5
  },
  inactiveSortBtn: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  activeSortBtn: {
    backgroundColor: '#2575fc',
    borderColor: '#2575fc',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000', // Black text
    marginLeft: -4,
    marginRight: 4
  }
});