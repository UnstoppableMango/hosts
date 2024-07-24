package cmd

import (
	"github.com/spf13/cobra"
	hosts "github.com/unstoppablemango/hosts/deploy/internal"
)

func init() {
	rootCmd.AddCommand(previewCmd)
}

var previewCmd = &cobra.Command{
	Use:     "preview",
	Aliases: []string{"p"},
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()

		root, err := hosts.RepoPath()
		if err != nil {
			return err
		}

		workspace, err := hosts.NewWorkspace(ctx, &hosts.WorkspaceOptions{
			Root:   root,
			Logger: log,
		})
		if err != nil {
			return err
		}

		for _, name := range controlplanes {
			log.Debug("Creating host")
			host, err := workspace.GetHost(ctx, name)
			if err != nil {
				return err
			}

			log.Info("Previewing host")
			if err = host.Preview(ctx); err != nil {
				return err
			}
		}

		for _, name := range workers {
			log.Debug("Creating host")
			host, err := workspace.GetHost(ctx, name)
			if err != nil {
				return err
			}

			log.Info("Previewing host")
			if err = host.Preview(ctx); err != nil {
				return err
			}
		}

		return nil
	},
}
