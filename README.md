# Spices - Icons

1. Find out the list of icons in Figma
2. Export the icons from Figma as svg
3. Create the svg sprite
4. Increment the version number (minor)
5. Via CI - Upload the new version to s3

## Commands

```shell
yarn ci [step]
```

`before` 

Sanity checks for publishing a new version.
Will clean up and create the output folders

`build` 

1. Find the list of icons in Figma
2. Download the icons in the output folder
3. Generate the svg sprite

`deploy` 

Deploy the svg sprite to a s3 bucket

`publish` 

Make sure everyone knows about the bundle deploiement.
Will publish a note on the discord channel. 

`version` 

Finds out the proper version of the bundle.


--------------------
TODO

- Implement the versionning
- Implement the changelog 



src
  - assets
    - icons/**
    - spices-icons.svg
    -
  