/**
 * OpenAPI component schemas
 *
 * Reusable schema definitions that mirror the TypeScript types in types.ts.
 * These are picked up by swagger-jsdoc to populate components.schemas.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     QualityType:
 *       type: string
 *       enum: [low, normal, high, max]
 *       description: Audio quality level
 *
 *     ContentType:
 *       type: string
 *       enum:
 *         - album
 *         - track
 *         - playlist
 *         - artist
 *         - video
 *         - mix
 *         - favorite_albums
 *         - favorite_tracks
 *         - favorite_playlists
 *         - favorite_videos
 *         - favorite_artists
 *         - artist_videos
 *       description: Type of Tidal content
 *
 *     ItemStatus:
 *       type: string
 *       enum:
 *         - queue_download
 *         - download
 *         - queue_processing
 *         - processing
 *         - queue
 *         - finished
 *         - error
 *         - no_download
 *       description: Current processing status of a queue item
 *
 *     ProcessingItem:
 *       type: object
 *       required: [id, artist, title, type, status, quality, url, loading, error]
 *       properties:
 *         id:
 *           type: string
 *         artist:
 *           type: string
 *         title:
 *           type: string
 *         type:
 *           $ref: '#/components/schemas/ContentType'
 *         status:
 *           $ref: '#/components/schemas/ItemStatus'
 *         quality:
 *           $ref: '#/components/schemas/QualityType'
 *         url:
 *           type: string
 *         loading:
 *           type: boolean
 *         error:
 *           type: boolean
 *         retryCount:
 *           type: integer
 *         networkError:
 *           type: boolean
 *         source:
 *           type: string
 *           enum: [lidarr, tidarr]
 *         progress:
 *           type: object
 *           properties:
 *             current:
 *               type: integer
 *             total:
 *               type: integer
 *
 *     SyncItem:
 *       type: object
 *       required: [id, title, url, quality, type]
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         url:
 *           type: string
 *         artist:
 *           type: string
 *         lastUpdate:
 *           type: string
 *         quality:
 *           $ref: '#/components/schemas/QualityType'
 *         type:
 *           $ref: '#/components/schemas/ContentType'
 *
 *     AuthResponse:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, error]
 *         token:
 *           type: string
 *         error:
 *           type: string
 *
 *     IsAuthActiveResponse:
 *       type: object
 *       required: [isAuthActive, authType]
 *       properties:
 *         isAuthActive:
 *           type: boolean
 *         authType:
 *           type: string
 *           enum: [password, oidc]
 *           nullable: true
 *
 *     SettingsResponse:
 *       type: object
 *       required: [output, parameters, noToken]
 *       properties:
 *         output:
 *           type: string
 *         parameters:
 *           type: object
 *           additionalProperties:
 *             type: string
 *         noToken:
 *           type: boolean
 *         tiddl_config:
 *           type: object
 *           description: Tiddl downloader configuration
 *         configErrors:
 *           type: array
 *           items:
 *             type: string
 *
 *     QueueStatusResponse:
 *       type: object
 *       required: [isPaused]
 *       properties:
 *         isPaused:
 *           type: boolean
 *
 *     CustomCSSResponse:
 *       type: object
 *       required: [css]
 *       properties:
 *         css:
 *           type: string
 *
 *     CustomCSSSaveResponse:
 *       type: object
 *       required: [success, message]
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *
 *     TiddlTomlResponse:
 *       type: object
 *       required: [toml]
 *       properties:
 *         toml:
 *           type: string
 *
 *     TiddlTomlSaveResponse:
 *       type: object
 *       required: [success, message]
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *
 *     ApiKeyResponse:
 *       type: object
 *       required: [apiKey]
 *       properties:
 *         apiKey:
 *           type: string
 *
 *     ApiError:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: string
 */
