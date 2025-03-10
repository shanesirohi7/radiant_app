import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  PanResponder,
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import { Heart, X, Volume2, VolumeX, RepeatIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

const MemeFeedScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-width * 0.7, 0, width * 0.7],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  // Use a direct Video ref approach for current video only
  const currentVideoRef = useRef(null);
  
  // Sample video data - replace with your actual data source
  const videos = [
    { 
      id: '1', 
      uri: 'https://res.cloudinary.com/dzljsey6i/video/upload/v1740331512/memes/videos/videoplayback.mp4.mp4',
      username: '@skibiditoilet',
      description: 'Bhai mujhe maaf krdo'
    },
    { 
      id: '2', 
      uri: 'https://res.cloudinary.com/dzljsey6i/video/upload/v1740330826/memes/videos/videoplayback%20%281%29.mp4.mp4',
      username: '@dompolo',
      description: 'Lmao'
    },
    { 
      id: '3', 
      uri: 'https://res.cloudinary.com/dzljsey6i/video/upload/v1740743455/memes/videos/Cristiano%20Ronaldo%20drinking%20meme%20HD%20%28full%20screen%29.mp4.mp4',
      username: '@cristiano',
      description: 'Cristiano Ronaldo drinking milk lmao..'
    },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleLike();
      nextVideo();
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleDislike();
      nextVideo();
    });
  };

  const nextVideo = () => {
    // Reset position first before changing index
    position.setValue({ x: 0, y: 0 });
    
    // Wait for animation frame to complete before loading next video
    requestAnimationFrame(() => {
      setIsLoading(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
    });
  };

  const handleLike = () => {
    console.log(`Liked video ${videos[currentIndex].id}`);
    // Add your like handling logic here
  };

  const handleDislike = () => {
    console.log(`Disliked video ${videos[currentIndex].id}`);
    // Add your dislike handling logic here
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width * 0.4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-width * 0.4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const toggleMute = () => {
    setMuted(!muted);
    if (currentVideoRef.current) {
      currentVideoRef.current.setIsMutedAsync(!muted);
    }
  };

  // Reset loading state and play video when index changes
  useEffect(() => {
    let mounted = true;
    
    const playVideo = async () => {
      try {
        if (currentVideoRef.current) {
          // Ensure video is loaded and ready
          await currentVideoRef.current.unloadAsync();
          
          // Small delay to ensure proper unloading
          setTimeout(async () => {
            if (mounted && currentVideoRef.current) {
              // Reload with current video source
              await currentVideoRef.current.loadAsync(
                { uri: videos[currentIndex].uri },
                { shouldPlay: true, isMuted: muted },
                false
              );
            }
          }, 50);
        }
      } catch (error) {
        console.error("Error playing video:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    playVideo();
    
    return () => {
      mounted = false;
      if (currentVideoRef.current) {
        currentVideoRef.current.unloadAsync();
      }
    };
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotation },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Video
            ref={currentVideoRef}
            style={styles.video}
            resizeMode="cover"
            isLooping
            isMuted={muted}
            onReadyForDisplay={() => setIsLoading(false)}
            onError={(error) => {
              console.error(`Error loading video:`, error);
              setIsLoading(false);
            }}
            // Force hardware acceleration on Android
            progressUpdateIntervalMillis={50}
            positionMillis={0}
            rate={1.0}
          />

          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.username}>{videos[currentIndex].username}</Text>
              <Text style={styles.description}>{videos[currentIndex].description}</Text>
            </View>
          </LinearGradient>

          <Animated.View style={[styles.likeContainer, { opacity: likeOpacity }]}>
            <Heart fill="#00ff00" color="#00ff00" size={80} />
          </Animated.View>

          <Animated.View style={[styles.dislikeContainer, { opacity: dislikeOpacity }]}>
            <X color="#ff0000" size={80} />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Debug info to show current video */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Currently playing: {currentIndex + 1}/{videos.length}</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={swipeLeft}>
          <X color="#ff0000" size={32} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={toggleMute}>
          {muted ? (
            <VolumeX color="#ffffff" size={32} />
          ) : (
            <Volume2 color="#ffffff" size={32} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={swipeRight}>
          <Heart fill="#00ff00" color="#00ff00" size={32} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.replayButton} 
        onPress={() => {
          if (currentVideoRef.current) {
            currentVideoRef.current.replayAsync();
          }
        }}
      >
        <RepeatIcon color="#ffffff" size={24} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width,
    height: height - 100,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoContainer: {
    marginBottom: 20,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: '#fff',
    fontSize: 16,
  },
  likeContainer: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '15deg' }],
  },
  dislikeContainer: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-15deg' }],
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  replayButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  debugText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
});

export default MemeFeedScreen;