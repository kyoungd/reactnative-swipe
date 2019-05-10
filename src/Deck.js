import React, {Component} from 'react';
import { 
  StyleSheet, 
  Animated, 
  View, 
  Text, 
  PanResponder, 
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { Card, Button } from 'react-native-elements';

/*
  Dimenions is the dimension of the display.
*/
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.5;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
  /*
    These are the default props.
    You can also use type to check empty variables, but this is easier.
  */
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
  }

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();

    /*
    onStartShouldSetPanResponder - returns true, than press is handled by this function.
    onPanResponderMove - handles when dragging
    onPanResponderRelease - handles when user releases dragging
    Initially, position x, y = 0, 0.  It is relative to the display container.
    */
    const handleCardGesture = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({x: gesture.dx, y: gesture.y});
      },
      onPanResponderRelease: (event, gesture) => {
        const index = this.state.cardIndex;
        if (gesture.dx > SWIPE_THRESHOLD)
          this.forceSwipe('right');
        else if (gesture.dx < -SWIPE_THRESHOLD)
          this.forceSwipe('left');
        else
          this.resetPosition();
      }
    });
    this.state = { handleCardGesture, position, index: 0 };
  }

  /*
    The card bounces back to the starting position if it is not
    moved too far in any direction.
  */
  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  /*
    This method is called when component receives new data to draw.
    It resets the index to 0.
  */
  componentWillReceiveProps(nextProps) {
    if (newProps.data != this.props.data) {
      this.setState({index: 0})
    }
  }

  /*
    This method smooths out the jump when a new card is shown after the previous one is swiped.
    The state.index data set and this method is called.
    This calls an overall broad stroke animation on the next re-draw.
    LayoutAnimation.spring() gives it a spring bounce.
  */
  componentWillUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  /* 
    This animates swipe to the left/right motion where the card
    roates and spins out of view.
  */
  forceSwipe(direction) {
    const width = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.state.position, {
      toValue: {x: width, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction));
  }

  /*
    When the swipe is complete, and the card is off scren,
    display the next screen.
  */
  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight } = this.props;
    const item = this.props.data[this.state.index];

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.state.position.setValue({x:0, y:0});
    this.setState({index: this.state.index + 1});
  }

  /*
    This style rotates the card as it is moved horizontally.
  */
  getCardStyle() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-85deg', '0deg', '85deg']
    });

    return { 
      ...position.getLayout(),
      transform: [{ rotate }]
    }
  }

  /*
    render card.
      If index matches the display index (this.state.index) than show it with tinder like styling.
      All other cards, show it as straight view. 
      Use Animiated.View instead of View to stop the flickering when the new card becomes active.

      Add zIndex to stack the cards.  There is an issue with android with map().reverse().
      Styling, top: is used to allow all the card to be peeked from the top.  All the cards are
        shown slightly below the previous cards.
  */
  renderCards() {
    return this.props.data.map((item, index) => {
      if (index === this.state.index) {
        return (
          <Animated.View 
            key={item.id}
            style = { [this.getCardStyle(), styles.card, {zIndex: index * -1}] }
            {...this.state.handleCardGesture.panHandlers}
          >
            { this.props.renderCard(item) }
          </Animated.View>
        )
      }
      else if (index > this.state.index)
        return (
          <Animated.View 
            key={item.id} 
            style={[styles.card, {zIndex: index * -1, top: 10 * (index - this.state.index)}]}
            >
            { this.props.renderCard(item) }
          </Animated.View>
        ); 
    })
  }

  /*
    This card is rendered after all the cards are swiped.
  */
  renderNoMoreCard() {
    return (
      <Card title="All Done!" key="00">
        <Text style={{ marginBottom: 10 }}>
          There is no more content here!
        </Text>
        <Button
          title="Get More" >
        </Button>
      </Card>
    )
  }

  render() {
    return (this.state.index < this.props.data.length ? this.renderCards() : this.renderNoMoreCard());
  }
}

/*
  Make the position absolute to stack the cards.
*/
const styles = {
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH,
  }
}

export default Deck;
