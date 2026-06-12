#include <emscripten.h>
#include "lame.h"

EMSCRIPTEN_KEEPALIVE
lame_global_flags *init(int number_of_channels, int sample_rate, int kilo_bitrate) {
  lame_global_flags *flags = lame_init();
  lame_set_num_channels(flags, number_of_channels);
  lame_set_in_samplerate(flags, sample_rate);
  lame_set_out_samplerate(flags, sample_rate);
  lame_set_brate(flags, kilo_bitrate);
  lame_set_bWriteVbrTag(flags, 0);
  int success = lame_init_params(flags);
  return success == -1 ? NULL : flags;
}

EMSCRIPTEN_KEEPALIVE
int encode_float(
  lame_global_flags *flags,
  float left_buffer[],
  float right_buffer[],
  int sample_count,
  unsigned char *destination_buffer,
  int destination_buffer_size
) {
  return lame_encode_buffer_ieee_float(flags, left_buffer, right_buffer, sample_count, destination_buffer, destination_buffer_size);
}

EMSCRIPTEN_KEEPALIVE
int flush(lame_global_flags *flags, unsigned char *destination_buffer, int destination_buffer_size) {
  return lame_encode_flush(flags, destination_buffer, destination_buffer_size);
}

EMSCRIPTEN_KEEPALIVE
void close(lame_global_flags *flags) {
  lame_close(flags);
}
