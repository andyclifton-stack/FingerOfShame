# Imposter

A simple dinner-table imposter word game for one shared phone.

## Open locally

From the `FingerOfShame` folder, run:

```powershell
npm start
```

Then open:

```text
http://localhost:8081/imposter/
```

You can also open `index.html` directly in a browser.

## Edit categories and words

Open `app.js` and find the clearly labelled `WORD_BANK` object near the top of the file.

Add a new category like this:

```js
const WORD_BANK = {
  Animals: ["penguin", "elephant"],
  "New Category": ["first word", "second word"]
};
```

Keep words family-friendly. The app chooses one category and one word at random unless a custom category and word are entered during setup.
