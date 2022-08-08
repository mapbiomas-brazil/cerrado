## function to rasterize vector into geoTif
## dhemerson.costa@ipam.org.br

library(stars)
library(sf)
library(raster)

vec_to_raster <- function(vector, resolution, field_name, parameter, output) {
  ## read vector
    file <- read_sf(vector)

    ## create mask
    mask <- raster(crs=projection(file), ext= extent(file))

    ## set resolution
    res(mask) = resolution

    ## rasterize
    raster_file <- rasterize(x= file, y= mask, field= field_name, fun= parameter, progress='text')

    writeRaster(raster_file, output, drive="GTiff")
}
