package hosts

import (
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
)

type previewColor struct{}
type upColor struct{}
type destroyColor struct{}

type ColorOpts struct {
	Preview optpreview.Option
	Up      optup.Option
	Destroy optdestroy.Option
}

var colors = &ColorOpts{
	Preview: &previewColor{},
	Up:      &upColor{},
	Destroy: &destroyColor{},
}

func (previewColor) ApplyOption(opts *optpreview.Options) {
	opts.Color = "always"
}

func (upColor) ApplyOption(opts *optup.Options) {
	opts.Color = "always"
}

func (destroyColor) ApplyOption(opts *optdestroy.Options) {
	opts.Color = "always"
}
