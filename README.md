# Versify 

I built this app with the help of Claude so that I can memorize poetry.

https://gulley.github.io/Versify/

## To do
- Don't make me type in punctuation marks. Fill them in for me. 
- Bug: Settings Hint delay time slider is not smooth
- Completion slider should go in the text input area

- Make it optional to show the original clear text on the side. With associated settings option checkbox. Default value is false.
- Make sure the line being filled in is always visible on the screen
- Bug: typing the wrong letter can trigger a look-ahead for that letter somewhere in the poem
- Bug: "tworoads" matches "two roads" when it shouldn't
- Bug: State of "Show dots for letters" checkbox is often wrong when the settings dialog first opens
- Put a "starter poem" in at initialization time
- Add a timer
- Record mistyped letters
- Save time and mistypes
- Plot time and mistype progress for the same poem
- Progress bar should represent progress at the character level, not just the line level

## Done
- Bug: cards should always be light colored for readability contrast
- Typing slash "/" should move focus to text input region
- Settings: Hint delay time slider should honor increments of 0.1 sec
- Prevent the wrong letter from appearing in the text input region
- At the completion of the poem (100%) the page background should darken and the text should darken (resets to default colors after load or reload).
- Hint letter should be a different color. Maybe pink.
- Get tooltips for icons
- Get rid of percent progress number